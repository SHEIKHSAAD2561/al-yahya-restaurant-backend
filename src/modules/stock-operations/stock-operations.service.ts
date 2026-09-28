import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { StockMovement } from './entities/stock-movement.entity';
import { StockMovementLine } from './entities/stock-movement-line.entity';
import { StockMovementStatus, StockMovementType } from './stock-movement.enums';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateStockMovementDto } from './dto/update-stock-movement.dto';
import { QueryStockMovementsDto } from './dto/query-stock-movements.dto';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { VariantLocation } from '../products/entities/variant-location.entity';
import { ProductType } from '../products/product-type.enum';
import type { RequestUser } from '../../common/types/authenticated-request';

interface ResolvedMovementLine {
  variantId: string;
  productName: string;
  sku: string;
  quantity: number;
}

@Injectable()
export class StockOperationsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(StockMovement)
    private readonly movementRepository: Repository<StockMovement>,
    @InjectRepository(StockMovementLine)
    private readonly lineRepository: Repository<StockMovementLine>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(VariantLocation)
    private readonly variantLocationRepository: Repository<VariantLocation>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  async findAll(query: QueryStockMovementsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const qb = this.movementRepository
      .createQueryBuilder('movement')
      .innerJoinAndSelect('movement.location', 'location')
      .orderBy('movement.createdAt', 'DESC');
    if (query.locationId)
      qb.andWhere('movement.locationId = :locationId', {
        locationId: query.locationId,
      });
    if (query.type) qb.andWhere('movement.type = :type', { type: query.type });
    if (query.status)
      qb.andWhere('movement.status = :status', { status: query.status });

    const [movements, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: movements.map((movement) => ({
        id: movement.id,
        type: movement.type,
        status: movement.status,
        locationId: movement.locationId,
        locationName: movement.location!.name,
        reason: movement.reason,
        movementDate: movement.movementDate,
        createdAt: movement.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOneOrFail(id: string): Promise<StockMovement> {
    const movement = await this.movementRepository.findOne({
      where: { id },
      relations: { location: true, lines: true },
    });
    if (!movement) {
      throw new NotFoundException(this.t('stock_operations.not_found'));
    }
    return movement;
  }

  private async resolveLines(
    dto: CreateStockMovementDto,
  ): Promise<ResolvedMovementLine[]> {
    const variantIds = dto.lines.map((line) => line.variantId);
    if (new Set(variantIds).size !== variantIds.length) {
      throw new BadRequestException(this.t('stock_operations.duplicate_line'));
    }
    const variants = await this.variantRepository.find({
      where: { id: In(variantIds) },
      relations: { product: true },
    });
    const variantsById = new Map(
      variants.map((variant) => [variant.id, variant]),
    );

    return dto.lines.map((line) => {
      const variant = variantsById.get(line.variantId);
      if (!variant) {
        throw new BadRequestException(this.t('products.not_found'));
      }
      if (variant.product.type === ProductType.COMPOSITE) {
        throw new BadRequestException(
          `${this.t('stock_operations.composite_not_adjustable')} (${variant.sku})`,
        );
      }
      return {
        variantId: variant.id,
        productName: variant.product.name,
        sku: variant.sku,
        quantity: line.quantity,
      };
    });
  }

  private buildLineEntities(
    stockMovementId: string,
    lines: ResolvedMovementLine[],
  ): StockMovementLine[] {
    return lines.map((line) =>
      this.lineRepository.create({
        stockMovementId,
        variantId: line.variantId,
        productName: line.productName,
        sku: line.sku,
        quantity: line.quantity,
      }),
    );
  }

  async create(
    dto: CreateStockMovementDto,
    user: RequestUser,
  ): Promise<StockMovement> {
    const resolved = await this.resolveLines(dto);
    const wantsConfirmed = dto.status === StockMovementStatus.CONFIRMED;

    return this.dataSource.transaction(async (manager) => {
      const movement = manager.create(StockMovement, {
        type: dto.type,
        locationId: dto.locationId,
        reason: dto.reason.trim(),
        movementDate: dto.movementDate,
        status: StockMovementStatus.DRAFT,
        createdByUserId: user.id,
      });
      const saved = await manager.save(movement);
      await manager.save(this.buildLineEntities(saved.id, resolved));

      if (wantsConfirmed) {
        return this.applyConfirmation(manager, saved.id, resolved);
      }
      return saved;
    });
  }

  async update(
    id: string,
    dto: UpdateStockMovementDto,
  ): Promise<StockMovement> {
    const movement = await this.movementRepository.findOne({ where: { id } });
    if (!movement) {
      throw new NotFoundException(this.t('stock_operations.not_found'));
    }
    if (movement.status !== StockMovementStatus.DRAFT) {
      throw new BadRequestException(this.t('stock_operations.not_editable'));
    }

    return this.dataSource.transaction(async (manager) => {
      if (dto.type !== undefined) movement.type = dto.type;
      if (dto.locationId !== undefined) movement.locationId = dto.locationId;
      if (dto.reason !== undefined) movement.reason = dto.reason.trim();
      if (dto.movementDate !== undefined)
        movement.movementDate = dto.movementDate;

      if (dto.lines !== undefined) {
        const resolved = await this.resolveLines({
          type: movement.type,
          locationId: movement.locationId,
          reason: movement.reason,
          movementDate: movement.movementDate,
          lines: dto.lines,
        });
        await manager.delete(StockMovementLine, { stockMovementId: id });
        await manager.save(this.buildLineEntities(id, resolved));
      }
      return manager.save(movement);
    });
  }

  async remove(id: string): Promise<void> {
    const movement = await this.movementRepository.findOne({ where: { id } });
    if (!movement) {
      throw new NotFoundException(this.t('stock_operations.not_found'));
    }
    if (movement.status !== StockMovementStatus.DRAFT) {
      throw new BadRequestException(this.t('stock_operations.not_editable'));
    }
    await this.movementRepository.delete(id);
  }

  async confirm(id: string): Promise<StockMovement> {
    const movement = await this.movementRepository.findOne({
      where: { id },
      relations: { lines: true },
    });
    if (!movement) {
      throw new NotFoundException(this.t('stock_operations.not_found'));
    }
    if (movement.status !== StockMovementStatus.DRAFT) {
      throw new BadRequestException(
        this.t('stock_operations.already_confirmed'),
      );
    }
    const resolved: ResolvedMovementLine[] = movement.lines.map((line) => ({
      variantId: line.variantId,
      productName: line.productName,
      sku: line.sku,
      quantity: line.quantity,
    }));
    return this.dataSource.transaction((manager) =>
      this.applyConfirmation(manager, id, resolved),
    );
  }

  private async applyConfirmation(
    manager: EntityManager,
    movementId: string,
    lines: ResolvedMovementLine[],
  ): Promise<StockMovement> {
    const movement = await manager.findOneOrFail(StockMovement, {
      where: { id: movementId },
    });

    for (const line of lines) {
      const row = await manager.findOne(VariantLocation, {
        where: { variantId: line.variantId, locationId: movement.locationId },
      });
      if (movement.type === StockMovementType.OUT) {
        if (!row || row.quantity < line.quantity) {
          const variant = await manager.findOne(ProductVariant, {
            where: { id: line.variantId },
          });
          throw new BadRequestException(
            `${this.t('stock_operations.insufficient_stock')} (${variant?.sku ?? line.variantId})`,
          );
        }
        await manager.update(VariantLocation, row.id, {
          quantity: row.quantity - line.quantity,
        });
      } else if (row) {
        await manager.update(VariantLocation, row.id, {
          quantity: row.quantity + line.quantity,
        });
      } else {
        await manager.save(
          manager.create(VariantLocation, {
            variantId: line.variantId,
            locationId: movement.locationId,
            quantity: line.quantity,
          }),
        );
      }
    }

    movement.status = StockMovementStatus.CONFIRMED;
    movement.confirmedAt = new Date();
    return manager.save(movement);
  }
}
