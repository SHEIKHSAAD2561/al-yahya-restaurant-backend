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
import { decimalTransformer } from '../../../common/utils/decimal.transformer';
import { Supplier } from '../../suppliers/supplier.entity';
import { Location } from '../../locations/location.entity';
import { PurchaseInvoice } from '../../purchase-invoices/entities/purchase-invoice.entity';
import { User } from '../../users/user.entity';
import { ReturnInvoiceLine } from './return-invoice-line.entity';
import { ReturnInvoiceStatus } from '../return-invoice-status.enum';

/** A credit note for stock sent back to a supplier — the mirror image of
 * `PurchaseInvoice`: confirming decreases stock instead of increasing it.
 * Cost (`ProductVariant.cost`) is deliberately **not** recalculated on a
 * return — a return leaving doesn't change the weighted-average cost of
 * what remains, only quantity moves. */
@Entity('return_invoices')
export class ReturnInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  returnNumber: string | null;

  @Column({
    type: 'enum',
    enum: ReturnInvoiceStatus,
    default: ReturnInvoiceStatus.DRAFT,
  })
  status: ReturnInvoiceStatus;

  @Column({ type: 'uuid' })
  supplierId: string;

  @ManyToOne(() => Supplier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplierId' })
  supplier?: Supplier;

  @Column({ type: 'uuid' })
  locationId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'locationId' })
  location?: Location;

  /** Optional — a return can reference the original purchase invoice, or
   * stand alone (stock returned without one on hand). */
  @Column({ type: 'uuid', nullable: true })
  purchaseInvoiceId: string | null;

  @ManyToOne(() => PurchaseInvoice, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'purchaseInvoiceId' })
  purchaseInvoice?: PurchaseInvoice | null;

  @Column({ type: 'date' })
  returnDate: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  subtotal: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  taxAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  total: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'uuid' })
  createdByUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date | null;

  @OneToMany(() => ReturnInvoiceLine, (line) => line.returnInvoice, {
    cascade: true,
  })
  lines: ReturnInvoiceLine[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
