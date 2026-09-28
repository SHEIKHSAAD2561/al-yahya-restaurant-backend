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
import { Register } from '../../registers/entities/register.entity';
import { RegisterSession } from '../../registers/entities/register-session.entity';
import { Customer } from '../../customers/customer.entity';
import { User } from '../../users/user.entity';
import { PaymentMethod } from '../../payment-methods/payment-method.entity';
import { SaleLine } from './sale-line.entity';
import { DiscountType, SaleStatus, SellAt } from '../sale-enums';
import { decimalTransformer } from '../../../common/utils/decimal.transformer';

/**
 * One POS transaction — a "Pause Sale" cart (`PARKED`, no `invoiceNumber`
 * yet) or a finished sale (`COMPLETED`, `invoiceNumber` assigned at that
 * point — see SalesService.nextInvoiceNumber()). No void/return status yet;
 * Return Invoices is its own not-yet-built feature.
 */
@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** "S20260924-1" — assigned only on completion, so a parked cart never
   * consumes a number. Unique once set; null while PARKED. */
  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  invoiceNumber: string | null;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.PARKED })
  status: SaleStatus;

  @Column({ type: 'uuid' })
  registerId: string;

  @ManyToOne(() => Register, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'registerId' })
  register?: Register;

  @Column({ type: 'uuid' })
  registerSessionId: string;

  @ManyToOne(() => RegisterSession, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'registerSessionId' })
  registerSession?: RegisterSession;

  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;

  @ManyToOne(() => Customer, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer | null;

  @Column({ type: 'uuid' })
  cashierUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cashierUserId' })
  cashier?: User;

  @Column({ type: 'enum', enum: SellAt, default: SellAt.RETAIL })
  sellAt: SellAt;

  @Column({ type: 'enum', enum: DiscountType, nullable: true })
  discountType: DiscountType | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  discountValue: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note: string | null;

  /** Sum of line subtotals, before discount and tax. */
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
  discountAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  taxAmount: number;

  /** subtotal - discountAmount + taxAmount. */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  total: number;

  @Column({ type: 'uuid', nullable: true })
  paymentMethodId: string | null;

  @ManyToOne(() => PaymentMethod, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod?: PaymentMethod | null;

  /** Always equal to `total` today — full payment only (see SalesService;
   * `pos.checkout_post_payment` exists in the permission catalog for a
   * future deferred-payment flow, not implemented yet). */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  amountPaid: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  amountTendered: number | null;

  @OneToMany(() => SaleLine, (line) => line.sale, { cascade: true })
  lines: SaleLine[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
