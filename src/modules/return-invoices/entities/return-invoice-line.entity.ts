import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReturnInvoice } from './return-invoice.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Tax } from '../../taxes/tax.entity';
import { decimalTransformer } from '../../../common/utils/decimal.transformer';

@Entity('return_invoice_lines')
export class ReturnInvoiceLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  returnInvoiceId: string;

  @ManyToOne(() => ReturnInvoice, (invoice) => invoice.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'returnInvoiceId' })
  returnInvoice?: ReturnInvoice;

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

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  unitCost: number;

  @Column({ type: 'uuid', nullable: true })
  taxId: string | null;

  @ManyToOne(() => Tax, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'taxId' })
  tax?: Tax | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  taxRate: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  lineSubtotal: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  lineTax: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  lineTotal: number;
}
