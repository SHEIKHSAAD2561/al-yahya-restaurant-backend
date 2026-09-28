import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { Location } from '../../locations/location.entity';
import { Tax } from '../../taxes/tax.entity';
import { decimalTransformer } from '../../../common/utils/decimal.transformer';

/** Per-location stock and pricing for one variant (the "default" block on the
 * product form, one per location). A location with no row yet (e.g. created
 * after the product) reads as zero stock, no prices. */
@Entity('variant_locations')
@Unique(['variantId', 'locationId'])
export class VariantLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  variantId: string;

  @ManyToOne(() => ProductVariant, (variant) => variant.locations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @Column({ type: 'uuid' })
  locationId: string;

  @ManyToOne(() => Location, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'locationId' })
  location?: Location;

  /** Set from "Initial Quantity" on creation only — afterwards only stock
   * operations change it, never the product form. */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
    transformer: decimalTransformer,
  })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  retailPrice: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  wholesalePrice: number | null;

  /** Last buy price — gated by `products.view_cost` like cost. */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  buyPrice: number | null;

  @Column({ type: 'uuid', nullable: true })
  taxId: string | null;

  @ManyToOne(() => Tax, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'taxId' })
  tax?: Tax;
}
