import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StockMovement } from './stock-movement.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { decimalTransformer } from '../../../common/utils/decimal.transformer';

@Entity('stock_movement_lines')
export class StockMovementLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  stockMovementId: string;

  @ManyToOne(() => StockMovement, (movement) => movement.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'stockMovementId' })
  stockMovement?: StockMovement;

  @Column({ type: 'uuid' })
  variantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'variantId' })
  variant?: ProductVariant;

  @Column({ type: 'varchar', length: 200 })
  productName: string;

  @Column({ type: 'varchar', length: 50 })
  sku: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    transformer: decimalTransformer,
  })
  quantity: number;
}
