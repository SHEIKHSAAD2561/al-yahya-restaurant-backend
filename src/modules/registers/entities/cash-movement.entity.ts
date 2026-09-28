import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RegisterSession } from './register-session.entity';
import { User } from '../../users/user.entity';
import { CashMovementType } from '../register-enums';
import { decimalTransformer } from '../../../common/utils/decimal.transformer';

/** One "Add/Withdraw" entry against an open session. */
@Entity('cash_movements')
export class CashMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  registerSessionId: string;

  @ManyToOne(() => RegisterSession, (session) => session.cashMovements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'registerSessionId' })
  registerSession?: RegisterSession;

  @Column({ type: 'enum', enum: CashMovementType })
  type: CashMovementType;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;

  @Column({ type: 'uuid' })
  createdByUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User;

  @CreateDateColumn()
  createdAt: Date;
}
