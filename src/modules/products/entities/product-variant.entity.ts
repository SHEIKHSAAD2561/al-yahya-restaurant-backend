import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { VariantLocation } from './variant-location.entity';
import { decimalTransformer } from '../../../common/utils/decimal.transformer';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  /** VARIABLE only: this variant's value for each of the product's options,
   * in option order (e.g. ["Red", "Large"]). Null for SIMPLE/COMPOSITE. */
  @Column({ type: 'json', nullable: true })
  optionValues: string[] | null;

  /** Unique across all variants, and may not equal another variant's barcode. */
  @Column({ type: 'varchar', length: 50, unique: true })
  sku: string;

  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  barcode: string | null;

  /** Weighted average cost. Set from "Initial Cost" on creation; later moved
   * by purchases/stock operations. Always 0 for COMPOSITE (derived instead). */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  cost: number;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @OneToMany(() => VariantLocation, (row) => row.variant, { cascade: true })
  locations: VariantLocation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
