import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Promotion } from './promotion.entity';
import {
  PromotionDiscountType,
  PromotionTargetType,
  PromotionType,
} from './promotion.enums';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { UpdatePromotionStatusDto } from './dto/update-promotion-status.dto';
import { QueryPromotionsDto } from './dto/query-promotions.dto';

const MAX_PERCENT = 100;

export type PromotionStatus = 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'INACTIVE';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  private status(promotion: Promotion): PromotionStatus {
    if (!promotion.isActive) return 'INACTIVE';
    const now = new Date();
    if (promotion.startAt > now) return 'SCHEDULED';
    if (promotion.endAt && promotion.endAt < now) return 'EXPIRED';
    return 'ACTIVE';
  }

  private toListItem(promotion: Promotion) {
    return {
      id: promotion.id,
      name: promotion.name,
      type: promotion.type,
      status: this.status(promotion),
      startAt: promotion.startAt,
      endAt: promotion.endAt,
    };
  }

  private buildPromotionsQuery(query: QueryPromotionsDto) {
    const qb = this.promotionRepository.createQueryBuilder('promotion');

    if (query.search?.trim()) {
      qb.andWhere('promotion.name LIKE :search', {
        search: `%${query.search.trim()}%`,
      });
    }
    if (query.status === 'INACTIVE') {
      qb.andWhere('promotion.isActive = false');
    } else if (query.status === 'SCHEDULED') {
      qb.andWhere('promotion.isActive = true').andWhere(
        'promotion.startAt > NOW()',
      );
    } else if (query.status === 'ACTIVE') {
      qb.andWhere('promotion.isActive = true')
        .andWhere('promotion.startAt <= NOW()')
        .andWhere('(promotion.endAt IS NULL OR promotion.endAt >= NOW())');
    } else if (query.status === 'EXPIRED') {
      qb.andWhere('promotion.isActive = true')
        .andWhere('promotion.endAt IS NOT NULL')
        .andWhere('promotion.endAt < NOW()');
    }

    return qb.orderBy('promotion.createdAt', 'DESC');
  }

  async findAll(query: QueryPromotionsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const [promotions, total] = await this.buildPromotionsQuery(query)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: promotions.map((promotion) => this.toListItem(promotion)),
      total,
      page,
      pageSize,
    };
  }

  async findOneOrFail(
    id: string,
  ): Promise<Promotion & { status: PromotionStatus }> {
    const promotion = await this.promotionRepository.findOne({ where: { id } });
    if (!promotion) {
      throw new NotFoundException(this.t('promotions.not_found'));
    }
    return { ...promotion, status: this.status(promotion) };
  }

  private validateDates(startAt: Date, endAt: Date | null) {
    if (endAt && endAt <= startAt) {
      throw new BadRequestException(this.t('promotions.end_before_start'));
    }
  }

  private validatePercent(
    discountType: PromotionDiscountType | undefined,
    discountValue: number | undefined,
    key: string,
  ) {
    if (
      discountType === PromotionDiscountType.PERCENT &&
      discountValue !== undefined &&
      discountValue > MAX_PERCENT
    ) {
      throw new BadRequestException(this.t(key));
    }
  }

  private buildEntityFields(
    dto: CreatePromotionDto | UpdatePromotionDto,
  ): Partial<Promotion> {
    const startAt = dto.startAt ? new Date(dto.startAt) : undefined;
    const endAt =
      dto.endAt === null ? null : dto.endAt ? new Date(dto.endAt) : undefined;

    if (startAt) this.validateDates(startAt, endAt ?? null);
    this.validatePercent(
      dto.discountType,
      dto.discountValue,
      'promotions.discount_percent_max',
    );
    this.validatePercent(
      dto.getDiscountType,
      dto.getDiscountValue,
      'promotions.get_discount_percent_max',
    );

    const isDiscountType = dto.type === PromotionType.DISCOUNT_OFF_PRODUCTS;
    const isBuyXGetY = dto.type === PromotionType.BUY_X_GET_Y;

    return {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(startAt ? { startAt } : {}),
      ...(endAt !== undefined ? { endAt } : {}),
      ...(dto.applyToAllLocations !== undefined
        ? { applyToAllLocations: dto.applyToAllLocations }
        : {}),
      locationIds: dto.applyToAllLocations ? null : (dto.locationIds ?? null),
      // Discount off Products fields — cleared when the type isn't this one,
      // so switching a promotion's type never leaves stale config behind.
      targetType: isDiscountType ? (dto.targetType ?? null) : null,
      targetVariantIds:
        isDiscountType &&
        dto.targetType === PromotionTargetType.SPECIFIC_PRODUCTS
          ? (dto.targetVariantIds ?? null)
          : null,
      targetCategoryIds:
        isDiscountType && dto.targetType === PromotionTargetType.CATEGORIES
          ? (dto.targetCategoryIds ?? null)
          : null,
      discountType: isDiscountType ? (dto.discountType ?? null) : null,
      discountValue: isDiscountType ? (dto.discountValue ?? null) : null,
      // Buy X Get Y fields
      buyQuantity: isBuyXGetY ? (dto.buyQuantity ?? null) : null,
      buyTargetType: isBuyXGetY ? (dto.buyTargetType ?? null) : null,
      buyVariantIds:
        isBuyXGetY &&
        dto.buyTargetType === PromotionTargetType.SPECIFIC_PRODUCTS
          ? (dto.buyVariantIds ?? null)
          : null,
      buyCategoryIds:
        isBuyXGetY && dto.buyTargetType === PromotionTargetType.CATEGORIES
          ? (dto.buyCategoryIds ?? null)
          : null,
      getQuantity: isBuyXGetY ? (dto.getQuantity ?? null) : null,
      getTargetType: isBuyXGetY ? (dto.getTargetType ?? null) : null,
      getVariantIds:
        isBuyXGetY &&
        dto.getTargetType === PromotionTargetType.SPECIFIC_PRODUCTS
          ? (dto.getVariantIds ?? null)
          : null,
      getCategoryIds:
        isBuyXGetY && dto.getTargetType === PromotionTargetType.CATEGORIES
          ? (dto.getCategoryIds ?? null)
          : null,
      getDiscountType: isBuyXGetY ? (dto.getDiscountType ?? null) : null,
      getDiscountValue: isBuyXGetY ? (dto.getDiscountValue ?? null) : null,
    };
  }

  async create(dto: CreatePromotionDto): Promise<Promotion> {
    const promotion = this.promotionRepository.create(
      this.buildEntityFields(dto),
    );
    return this.promotionRepository.save(promotion);
  }

  async update(id: string, dto: UpdatePromotionDto): Promise<Promotion> {
    const promotion = await this.promotionRepository.findOne({ where: { id } });
    if (!promotion) {
      throw new NotFoundException(this.t('promotions.not_found'));
    }
    Object.assign(
      promotion,
      this.buildEntityFields({ ...promotion, ...dto } as CreatePromotionDto),
    );
    return this.promotionRepository.save(promotion);
  }

  async updateStatus(
    id: string,
    dto: UpdatePromotionStatusDto,
  ): Promise<Promotion> {
    const promotion = await this.promotionRepository.findOne({ where: { id } });
    if (!promotion) {
      throw new NotFoundException(this.t('promotions.not_found'));
    }
    promotion.isActive = dto.isActive;
    return this.promotionRepository.save(promotion);
  }

  async remove(id: string): Promise<void> {
    const result = await this.promotionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(this.t('promotions.not_found'));
    }
  }
}
