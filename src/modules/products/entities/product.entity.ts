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
import { ProductType } from '../product-type.enum';
import { ProductVariant } from './product-variant.entity';
import { ProductOption } from './product-option.entity';
import { ProductImage } from './product-image.entity';
import { CompositeComponent } from './composite-component.entity';
import { Category } from '../../categories/category.entity';
import { Brand } from '../../brands/brand.entity';
import { decimalTransformer } from '../../../common/utils/decimal.transformer';

/**
 * The "main product". What's sold/stocked is always a `ProductVariant` — a
 * SIMPLE or COMPOSITE product has exactly one, a VARIABLE product one per
 * option combination. The products list shows variants (hence its "Main
 * Product" column).
 */
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ProductType })
  type: ProductType;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true })
  isSellable: boolean;

  /** Always false for COMPOSITE (built from components, never bought). */
  @Column({ type: 'boolean', default: true })
  isPurchasable: boolean;

  /** Always false for COMPOSITE — its availability derives from components. */
  @Column({ type: 'boolean', default: true })
  trackQuantity: boolean;

  /** Sold by weight — its barcode follows Configuration's weighted-product format. */
  @Column({ type: 'boolean', default: false })
  isWeighted: boolean;

  @Column({ type: 'int', unsigned: true, nullable: true })
  reorderPoint: number | null;

  // Raw FK columns are the only thing ever mutated — the relations below
  // exist for the FK constraints and are never loaded (see CLAUDE.md's
  // TypeORM gotcha about paired FK column + relation).
  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => Category, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  @Column({ type: 'uuid', nullable: true })
  brandId: string | null;

  @ManyToOne(() => Brand, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brandId' })
  brand?: Brand;

  /** In Configuration's shipping units (kg/cm by default). */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    transformer: decimalTransformer,
  })
  shippingWeight: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  shippingLength: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  shippingWidth: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  shippingHeight: number | null;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants: ProductVariant[];

  @OneToMany(() => ProductOption, (option) => option.product, { cascade: true })
  options: ProductOption[];

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images: ProductImage[];

  @OneToMany(() => CompositeComponent, (component) => component.product, {
    cascade: true,
  })
  components: CompositeComponent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
