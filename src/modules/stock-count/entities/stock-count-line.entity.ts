import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StockCount } from './stock-count.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { decimalTransformer } from '../../../common/utils/decimal.transformer';

@Entity('stock_count_lines')
export class StockCountLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  stockCountId: string;

  @ManyToOne(() => StockCount, (count) => count.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stockCountId' })
  stockCount?: StockCount;

  @Column({ type: 'uuid' })
  variantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'variantId' })
  variant?: ProductVariant;

  @Column({ type: 'varchar', length: 200 })
  productName: string;

  @Column({ type: 'varchar', length: 50 })
  sku: string;

  /** Snapshotted from `VariantLocation.quantity` when the count was created. */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    transformer: decimalTransformer,
  })
  expectedQuantity: number;

  /** Null until someone enters what they physically counted. */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    nullable: true,
    transformer: decimalTransformer,
  })
  countedQuantity: number | null;
}
