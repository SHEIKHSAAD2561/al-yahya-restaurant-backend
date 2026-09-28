import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { decimalTransformer } from '../../common/utils/decimal.transformer';
import { Location } from '../locations/location.entity';
import { User } from '../users/user.entity';
import { ExpenseCategory } from './expense-category.enum';

/** A recorded operating expense — feeds the Home dashboard's Activity Log
 * and the Reports page's "Profit & expenses summary" / net income figure.
 * Deliberately simple (no approval workflow, no recurring-expense concept,
 * no linked chart-of-accounts entry) — those aren't shown anywhere in the
 * reference and would be scope invented, not built. */
@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ExpenseCategory })
  category: ExpenseCategory;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  /** Null = a company-wide expense (e.g. head-office rent), not tied to one
   * branch — same "no row = applies everywhere" convention used elsewhere. */
  @Column({ type: 'uuid', nullable: true })
  locationId: string | null;

  @ManyToOne(() => Location, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'locationId' })
  location?: Location | null;

  /** When the expense was incurred — distinct from `createdAt`, since it can
   * be logged after the fact (e.g. recording last month's utility bill). */
  @Column({ type: 'date' })
  expenseDate: string;

  @Column({ type: 'uuid' })
  createdByUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
