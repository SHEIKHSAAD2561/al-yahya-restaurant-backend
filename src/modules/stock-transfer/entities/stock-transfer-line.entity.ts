import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StockTransfer } from './stock-transfer.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { decimalTransformer } from '../../../common/utils/decimal.transformer';

@Entity('stock_transfer_lines')
export class StockTransferLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  stockTransferId: string;

  @ManyToOne(() => StockTransfer, (transfer) => transfer.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'stockTransferId' })
  stockTransfer?: StockTransfer;

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
