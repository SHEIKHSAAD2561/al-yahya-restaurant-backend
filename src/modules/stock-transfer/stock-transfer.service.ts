import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { StockTransfer } from './entities/stock-transfer.entity';
import { StockTransferLine } from './entities/stock-transfer-line.entity';
import { StockTransferStatus } from './stock-transfer-status.enum';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { QueryStockTransfersDto } from './dto/query-stock-transfers.dto';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { VariantLocation } from '../products/entities/variant-location.entity';
import { ProductType } from '../products/product-type.enum';
import type { RequestUser } from '../../common/types/authenticated-request';

@Injectable()
export class StockTransferService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(StockTransfer)
    private readonly transferRepository: Repository<StockTransfer>,
    @InjectRepository(StockTransferLine)
    private readonly lineRepository: Repository<StockTransferLine>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(VariantLocation)
    private readonly variantLocationRepository: Repository<VariantLocation>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  async findAll(query: QueryStockTransfersDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const qb = this.transferRepository
      .createQueryBuilder('transfer')
      .innerJoinAndSelect('transfer.fromLocation', 'fromLocation')
      .innerJoinAndSelect('transfer.toLocation', 'toLocation')
      .leftJoinAndSelect('transfer.requestedBy', 'requestedBy')
      .orderBy('transfer.createdAt', 'DESC');
    if (query.fromLocationId)
      qb.andWhere('transfer.fromLocationId = :fromLocationId', {
        fromLocationId: query.fromLocationId,
      });
    if (query.toLocationId)
      qb.andWhere('transfer.toLocationId = :toLocationId', {
        toLocationId: query.toLocationId,
      });
    if (query.status)
      qb.andWhere('transfer.status = :status', { status: query.status });

    const [transfers, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: transfers.map((transfer) => ({
        id: transfer.id,
        status: transfer.status,
        fromLocationId: transfer.fromLocationId,
        fromLocationName: transfer.fromLocation!.name,
        toLocationId: transfer.toLocationId,
        toLocationName: transfer.toLocation!.name,
        requestedByName: transfer.requestedBy?.nameEn ?? '',
        createdAt: transfer.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOneOrFail(id: string): Promise<StockTransfer> {
    const transfer = await this.transferRepository.findOne({
      where: { id },
      relations: {
        fromLocation: true,
        toLocation: true,
        lines: true,
        requestedBy: true,
      },
    });
    if (!transfer) {
      throw new NotFoundException(this.t('stock_transfer.not_found'));
    }
    return transfer;
  }

  async create(
    dto: CreateStockTransferDto,
    user: RequestUser,
  ): Promise<StockTransfer> {
    if (dto.fromLocationId === dto.toLocationId) {
      throw new BadRequestException(this.t('stock_transfer.same_location'));
    }
    const variantIds = dto.lines.map((line) => line.variantId);
    if (new Set(variantIds).size !== variantIds.length) {
      throw new BadRequestException(this.t('stock_transfer.duplicate_line'));
    }
    const variants = await this.variantRepository.find({
      where: { id: In(variantIds) },
      relations: { product: true },
    });
    const variantsById = new Map(
      variants.map((variant) => [variant.id, variant]),
    );
    const resolved = dto.lines.map((line) => {
      const variant = variantsById.get(line.variantId);
      if (!variant) {
        throw new BadRequestException(this.t('products.not_found'));
      }
      if (variant.product.type === ProductType.COMPOSITE) {
        throw new BadRequestException(
          `${this.t('stock_transfer.composite_not_transferable')} (${variant.sku})`,
        );
      }
      return {
        variantId: variant.id,
        productName: variant.product.name,
        sku: variant.sku,
        quantity: line.quantity,
      };
    });

    return this.dataSource.transaction(async (manager) => {
      const transfer = manager.create(StockTransfer, {
        fromLocationId: dto.fromLocationId,
        toLocationId: dto.toLocationId,
        notes: dto.notes?.trim() || null,
        status: StockTransferStatus.PENDING,
        requestedByUserId: user.id,
      });
      const saved = await manager.save(transfer);
      await manager.save(
        resolved.map((line) =>
          manager.create(StockTransferLine, {
            stockTransferId: saved.id,
            variantId: line.variantId,
            productName: line.productName,
            sku: line.sku,
            quantity: line.quantity,
          }),
        ),
      );
      return saved;
    });
  }

  async cancel(id: string, user: RequestUser): Promise<StockTransfer> {
    const transfer = await this.transferRepository.findOne({ where: { id } });
    if (!transfer) {
      throw new NotFoundException(this.t('stock_transfer.not_found'));
    }
    if (transfer.status !== StockTransferStatus.PENDING) {
      throw new BadRequestException(this.t('stock_transfer.not_pending'));
    }
    if (transfer.requestedByUserId !== user.id) {
      throw new BadRequestException(this.t('stock_transfer.not_requester'));
    }
    transfer.status = StockTransferStatus.CANCELLED;
    transfer.respondedByUserId = user.id;
    transfer.respondedAt = new Date();
    return this.transferRepository.save(transfer);
  }

  async reject(id: string, user: RequestUser): Promise<StockTransfer> {
    const transfer = await this.transferRepository.findOne({ where: { id } });
    if (!transfer) {
      throw new NotFoundException(this.t('stock_transfer.not_found'));
    }
    if (transfer.status !== StockTransferStatus.PENDING) {
      throw new BadRequestException(this.t('stock_transfer.not_pending'));
    }
    transfer.status = StockTransferStatus.REJECTED;
    transfer.respondedByUserId = user.id;
    transfer.respondedAt = new Date();
    return this.transferRepository.save(transfer);
  }

  /** Moves stock immediately — decreases `fromLocation`, increases
   * `toLocation` (creating the destination's `VariantLocation` row if it
   * doesn't exist yet, same "no row = zero stock" convention used
   * everywhere). Rejects the whole approval if any line's source location
   * doesn't have enough stock. */
  async approve(id: string, user: RequestUser): Promise<StockTransfer> {
    const transfer = await this.transferRepository.findOne({
      where: { id },
      relations: { lines: true },
    });
    if (!transfer) {
      throw new NotFoundException(this.t('stock_transfer.not_found'));
    }
    if (transfer.status !== StockTransferStatus.PENDING) {
      throw new BadRequestException(this.t('stock_transfer.not_pending'));
    }

    return this.dataSource.transaction(async (manager) => {
      for (const line of transfer.lines) {
        const fromRow = await manager.findOne(VariantLocation, {
          where: {
            variantId: line.variantId,
            locationId: transfer.fromLocationId,
          },
        });
        if (!fromRow || fromRow.quantity < line.quantity) {
          const variant = await manager.findOne(ProductVariant, {
            where: { id: line.variantId },
          });
          throw new BadRequestException(
            `${this.t('stock_transfer.insufficient_stock')} (${variant?.sku ?? line.variantId})`,
          );
        }
        await manager.update(VariantLocation, fromRow.id, {
          quantity: fromRow.quantity - line.quantity,
        });

        const toRow = await manager.findOne(VariantLocation, {
          where: {
            variantId: line.variantId,
            locationId: transfer.toLocationId,
          },
        });
        if (toRow) {
          await manager.update(VariantLocation, toRow.id, {
            quantity: toRow.quantity + line.quantity,
          });
        } else {
          await manager.save(
            manager.create(VariantLocation, {
              variantId: line.variantId,
              locationId: transfer.toLocationId,
              quantity: line.quantity,
            }),
          );
        }
      }

      transfer.status = StockTransferStatus.APPROVED;
      transfer.respondedByUserId = user.id;
      transfer.respondedAt = new Date();
      return manager.save(transfer);
    });
  }
}
