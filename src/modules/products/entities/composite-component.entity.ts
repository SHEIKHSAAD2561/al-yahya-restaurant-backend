import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { decimalTransformer } from '../../../common/utils/decimal.transformer';

/** One line of a COMPOSITE product: `quantity` of another (non-composite)
 * variant per unit of the composite. */
@Entity('composite_components')
export class CompositeComponent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.components, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  /** RESTRICT: a variant used in a composite can't be deleted out from under it. */
  @Column({ type: 'uuid' })
  componentVariantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'componentVariantId' })
  componentVariant?: ProductVariant;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    transformer: decimalTransformer,
  })
  quantity: number;
}
