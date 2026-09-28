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
import { Register } from './register.entity';
import { User } from '../../users/user.entity';
import { CashMovement } from './cash-movement.entity';
import { RegisterSessionStatus } from '../register-enums';
import { decimalTransformer } from '../../../common/utils/decimal.transformer';

/** One open→close instance of a Register. `expectedAmount`/`difference` are
 * only filled in on close (see RegistersService.close) — Phase 1 has no
 * sales yet, so "expected" is just opening cash plus cash movements; the
 * Sell Screen phase will add sales takings into that calculation. */
@Entity('register_sessions')
export class RegisterSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  registerId: string;

  @ManyToOne(() => Register, (register) => register.sessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'registerId' })
  register?: Register;

  @Column({
    type: 'enum',
    enum: RegisterSessionStatus,
    default: RegisterSessionStatus.OPEN,
  })
  status: RegisterSessionStatus;

  @Column({ type: 'uuid' })
  openedByUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'openedByUserId' })
  openedBy?: User;

  @CreateDateColumn()
  openedAt: Date;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  openingAmount: number;

  /** [{ value: 500, count: 2 }, ...] — denomination breakdown, display-only. */
  @Column({ type: 'json', nullable: true })
  openingDenominations: { value: number; count: number }[] | null;

  @Column({ type: 'uuid', nullable: true })
  closedByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'closedByUserId' })
  closedBy?: User;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  closingAmount: number | null;

  @Column({ type: 'json', nullable: true })
  closingDenominations: { value: number; count: number }[] | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  expectedAmount: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  difference: number | null;

  @OneToMany(() => CashMovement, (movement) => movement.registerSession)
  cashMovements: CashMovement[];

  @UpdateDateColumn()
  updatedAt: Date;
}
