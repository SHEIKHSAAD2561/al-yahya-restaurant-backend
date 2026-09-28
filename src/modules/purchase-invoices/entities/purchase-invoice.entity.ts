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
import { User } from '../../users/user.entity';
import { PurchaseInvoiceLine } from './purchase-invoice-line.entity';
import { PurchaseInvoiceStatus } from '../purchase-invoice-status.enum';

/** One supplier purchase — increases stock and moves each line's variant's
 * weighted-average cost, but only once `status` is `CONFIRMED` (see
 * `PurchaseInvoicesService.confirm()`). `invoiceNumber` is assigned only on
 * confirmation, same "no number until it's real" convention as `Sale`. */
@Entity('purchase_invoices')
export class PurchaseInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  invoiceNumber: string | null;

  @Column({
    type: 'enum',
    enum: PurchaseInvoiceStatus,
    default: PurchaseInvoiceStatus.DRAFT,
  })
  status: PurchaseInvoiceStatus;

  @Column({ type: 'uuid' })
  supplierId: string;

  @ManyToOne(() => Supplier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplierId' })
  supplier?: Supplier;

  /** Where the purchased stock lands. */
  @Column({ type: 'uuid' })
  locationId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'locationId' })
  location?: Location;

  @Column({ type: 'date' })
  invoiceDate: string;

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

  @OneToMany(() => PurchaseInvoiceLine, (line) => line.purchaseInvoice, {
    cascade: true,
  })
  lines: PurchaseInvoiceLine[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
