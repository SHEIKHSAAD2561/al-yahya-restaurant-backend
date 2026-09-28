import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RegisterSession } from './register-session.entity';
import { PaymentMethod } from '../../payment-methods/payment-method.entity';
import { decimalTransformer } from '../../../common/utils/decimal.transformer';

/**
 * One payment method's reconciliation line for a closed session — the
 * "Payment Methods" tab in Cash Management. `expectedAmount` is computed at
 * close time by `RegistersService.close()`: for the register's cash-type
 * payment method, opening float + cash movements + that method's completed
 * sales; for every other method, just its completed sales (no opening float,
 * no movements concept). `denominations` is only ever set for the cash-type
 * row.
 */
@Entity('register_session_payment_summaries')
export class RegisterSessionPaymentSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  registerSessionId: string;

  @ManyToOne(() => RegisterSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'registerSessionId' })
  registerSession?: RegisterSession;

  @Column({ type: 'uuid' })
  paymentMethodId: string;

  @ManyToOne(() => PaymentMethod, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod?: PaymentMethod;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  expectedAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  countedAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  difference: number;

  @Column({ type: 'json', nullable: true })
  denominations: { value: number; count: number }[] | null;
}
