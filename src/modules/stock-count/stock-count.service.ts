import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { StockCount } from './entities/stock-count.entity';
import { StockCountLine } from './entities/stock-count-line.entity';
import { StockCountStatus } from './stock-count-status.enum';
import { CreateStockCountDto } from './dto/create-stock-count.dto';
import { UpdateStockCountLinesDto } from './dto/update-stock-count-lines.dto';
import { QueryStockCountsDto } from './dto/query-stock-counts.dto';
import { VariantLocation } from '../products/entities/variant-location.entity';
import { ProductType } from '../products/product-type.enum';
import type { RequestUser } from '../../common/types/authenticated-request';

@Injectable()
export class StockCountService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(StockCount)
    private readonly stockCountRepository: Repository<StockCount>,
    @InjectRepository(StockCountLine)
    private readonly lineRepository: Repository<StockCountLine>,
    @InjectRepository(VariantLocation)
    private readonly variantLocationRepository: Repository<VariantLocation>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  async findAll(query: QueryStockCountsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const qb = this.stockCountRepository
      .createQueryBuilder('count')
      .innerJoinAndSelect('count.location', 'location')
      .orderBy('count.createdAt', 'DESC');
    if (query.locationId)
      qb.andWhere('count.locationId = :locationId', {
        locationId: query.locationId,
      });
    if (query.status)
      qb.andWhere('count.status = :status', { status: query.status });

    const [counts, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: counts.map((count) => ({
        id: count.id,
        status: count.status,
        locationId: count.locationId,
        locationName: count.location!.name,
        countDate: count.countDate,
        createdAt: count.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOneOrFail(id: string): Promise<StockCount> {
    const count = await this.stockCountRepository.findOne({
      where: { id },
      relations: { location: true, lines: true },
    });
    if (!count) {
      throw new NotFoundException(this.t('stock_count.not_found'));
    }
    return count;
  }

  /** Snapshots every non-composite variant that currently has a stock row at
   * this location — a count covers "everything on the shelf", not a
   * hand-picked list like a purchase invoice's lines. A variant with no
   * `VariantLocation` row at all reads as zero stock everywhere else in this
   * codebase, so it's excluded here too (nothing to count). */
  async create(
    dto: CreateStockCountDto,
    user: RequestUser,
  ): Promise<StockCount> {
    const rows = await this.variantLocationRepository.find({
      where: { locationId: dto.locationId },
      relations: { variant: { product: true } },
    });
    const countable = rows.filter(
      (row) => row.variant?.product.type !== ProductType.COMPOSITE,
    );
    if (countable.length === 0) {
      throw new BadRequestException(this.t('stock_count.nothing_to_count'));
    }

    return this.dataSource.transaction(async (manager) => {
      const count = manager.create(StockCount, {
        locationId: dto.locationId,
        countDate: dto.countDate,
        status: StockCountStatus.DRAFT,
        createdByUserId: user.id,
      });
      const saved = await manager.save(count);
      await manager.save(
        countable.map((row) =>
          manager.create(StockCountLine, {
            stockCountId: saved.id,
            variantId: row.variantId,
            productName: row.variant.product.name,
            sku: row.variant.sku,
            expectedQuantity: row.quantity,
            countedQuantity: null,
          }),
        ),
      );
      return saved;
    });
  }

  async updateLines(
    id: string,
    dto: UpdateStockCountLinesDto,
  ): Promise<StockCount> {
    const count = await this.stockCountRepository.findOne({
      where: { id },
      relations: { lines: true },
    });
    if (!count) {
      throw new NotFoundException(this.t('stock_count.not_found'));
    }
    if (count.status !== StockCountStatus.DRAFT) {
      throw new BadRequestException(this.t('stock_count.not_editable'));
    }
    const lineIds = new Set(count.lines.map((line) => line.id));
    for (const update of dto.lines) {
      if (!lineIds.has(update.id)) {
        throw new BadRequestException(this.t('stock_count.line_not_found'));
      }
    }
    await Promise.all(
      dto.lines.map((update) =>
        this.lineRepository.update(update.id, {
          countedQuantity: update.countedQuantity,
        }),
      ),
    );
    return this.findOneOrFail(id);
  }

  async remove(id: string): Promise<void> {
    const count = await this.stockCountRepository.findOne({ where: { id } });
    if (!count) {
      throw new NotFoundException(this.t('stock_count.not_found'));
    }
    if (count.status !== StockCountStatus.DRAFT) {
      throw new BadRequestException(this.t('stock_count.not_editable'));
    }
    await this.stockCountRepository.delete(id);
  }

  /** For every line that was actually counted (`countedQuantity` not null),
   * sets `VariantLocation.quantity` to match — an uncounted line is left
   * untouched, not zeroed out (the cashier may simply not have reached that
   * shelf yet, that's not the same as "we counted zero"). */
  async confirm(id: string): Promise<StockCount> {
    const count = await this.stockCountRepository.findOne({
      where: { id },
      relations: { lines: true },
    });
    if (!count) {
      throw new NotFoundException(this.t('stock_count.not_found'));
    }
    if (count.status !== StockCountStatus.DRAFT) {
      throw new BadRequestException(this.t('stock_count.already_confirmed'));
    }

    return this.dataSource.transaction(async (manager) => {
      for (const line of count.lines) {
        if (line.countedQuantity === null) continue;
        const row = await manager.findOne(VariantLocation, {
          where: { variantId: line.variantId, locationId: count.locationId },
        });
        if (row) {
          await manager.update(VariantLocation, row.id, {
            quantity: line.countedQuantity,
          });
        }
      }
      count.status = StockCountStatus.CONFIRMED;
      count.confirmedAt = new Date();
      return manager.save(count);
    });
  }
}
