import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { decimalTransformer } from '../../common/utils/decimal.transformer';
import {
  PromotionDiscountType,
  PromotionTargetType,
  PromotionType,
} from './promotion.enums';

/**
 * Both creation flows (Discount off Products / Buy X Get Y) share this one
 * table — the fields each flow doesn't use stay `null`, enforced per-`type`
 * in `CreatePromotionDto`/`UpdatePromotionDto` (`@ValidateIf`), not by two
 * separate tables. **Deliberately not enforced at checkout** in this phase
 * (see `SalesService` — no promotion lookup happens there yet); this is
 * catalog/management only, the same phase boundary Registers→Sell Screen had.
 *
 * Location and product/category targeting are plain JSON id arrays
 * (`locationIds`, `targetVariantIds`, etc.), not join tables — there is no
 * enforcement path querying them relationally yet, so a real join table
 * would be schema weight with no reader; upgrade to relations if/when
 * checkout-time enforcement is built.
 */
@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'enum', enum: PromotionType })
  type: PromotionType;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'datetime' })
  startAt: Date;

  @Column({ type: 'datetime', nullable: true })
  endAt: Date | null;

  @Column({ type: 'boolean', default: true })
  applyToAllLocations: boolean;

  /** Only meaningful when `applyToAllLocations` is false. */
  @Column({ type: 'json', nullable: true })
  locationIds: string[] | null;

  // ---- DISCOUNT_OFF_PRODUCTS ----
  @Column({ type: 'enum', enum: PromotionTargetType, nullable: true })
  targetType: PromotionTargetType | null;

  @Column({ type: 'json', nullable: true })
  targetVariantIds: string[] | null;

  @Column({ type: 'json', nullable: true })
  targetCategoryIds: string[] | null;

  @Column({ type: 'enum', enum: PromotionDiscountType, nullable: true })
  discountType: PromotionDiscountType | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  discountValue: number | null;

  // ---- BUY_X_GET_Y ----
  @Column({ type: 'int', unsigned: true, nullable: true })
  buyQuantity: number | null;

  @Column({ type: 'enum', enum: PromotionTargetType, nullable: true })
  buyTargetType: PromotionTargetType | null;

  @Column({ type: 'json', nullable: true })
  buyVariantIds: string[] | null;

  @Column({ type: 'json', nullable: true })
  buyCategoryIds: string[] | null;

  @Column({ type: 'int', unsigned: true, nullable: true })
  getQuantity: number | null;

  @Column({ type: 'enum', enum: PromotionTargetType, nullable: true })
  getTargetType: PromotionTargetType | null;

  @Column({ type: 'json', nullable: true })
  getVariantIds: string[] | null;

  @Column({ type: 'json', nullable: true })
  getCategoryIds: string[] | null;

  /** How much off the "Get" side — e.g. 100% for a free item. */
  @Column({ type: 'enum', enum: PromotionDiscountType, nullable: true })
  getDiscountType: PromotionDiscountType | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  getDiscountValue: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
