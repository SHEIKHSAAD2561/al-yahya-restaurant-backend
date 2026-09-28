import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from '../../common/utils/decimal.transformer';
import { Customer } from '../customers/customer.entity';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import { User } from '../users/user.entity';

/**
 * A settlement against a customer's running receivable balance — not tied to
 * a specific `Sale` (same account-level approach as `SupplierPayment`, not a
 * per-invoice allocation system; matches `customers.manage_settlements` at
 * the account level, a deliberate scope match with Supplier Payments rather
 * than a much larger per-invoice ledger). `CustomersService.balance()` is
 * `Σ(sale.total − sale.amountPaid) for COMPLETED sales − Σpayments`, where
 * the per-sale gap is only ever non-zero for a "Pay Later"
 * (`isPostPayment`) checkout — see SalesService.checkout().
 */
@Entity('customer_payments')
export class CustomerPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;

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
