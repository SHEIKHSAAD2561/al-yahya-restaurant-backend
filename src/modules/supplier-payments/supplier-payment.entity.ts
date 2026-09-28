import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from '../../common/utils/decimal.transformer';
import { Supplier } from '../suppliers/supplier.entity';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import { User } from '../users/user.entity';

/**
 * A settlement against a supplier's running balance — not tied to a specific
 * `PurchaseInvoice` (matches `purchases_suppliers.manage_suppliers_payables`'s
 * "manage supplier payables and create settlements against supplier
 * invoices" at the account level, not a per-invoice allocation system).
 * `SuppliersService.balance()` is `Σconfirmed purchase invoices − Σconfirmed
 * returns − Σpayments`.
 */
@Entity('supplier_payments')
export class SupplierPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  supplierId: string;

  @ManyToOne(() => Supplier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplierId' })
  supplier?: Supplier;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ type: 'uuid', nullable: true })
  paymentMethodId: string | null;

  @ManyToOne(() => PaymentMethod, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod?: PaymentMethod | null;

  @Column({ type: 'date' })
  paymentDate: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string | null;

  @Column({ type: 'uuid' })
  createdByUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User;

  @CreateDateColumn()
  createdAt: Date;
}
