import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentMethodType } from './payment-method-type.enum';
import { BankAccount } from './bank-account.entity';

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'enum', enum: PaymentMethodType })
  type: PaymentMethodType;

  /** Always mutate this raw column, never `bankAccount` — the relation exists
   * only for the FK constraint and is never loaded (see CLAUDE.md's TypeORM
   * gotcha about paired FK column + relation). */
  @Column({ type: 'uuid', nullable: true })
  bankAccountId: string | null;

  @ManyToOne(() => BankAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'bankAccountId' })
  bankAccount?: BankAccount;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  /** Set only on seeded rows (Cash, Credit Card) — their type is locked. */
  @Column({ type: 'varchar', length: 30, nullable: true, unique: true })
  systemCode: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
