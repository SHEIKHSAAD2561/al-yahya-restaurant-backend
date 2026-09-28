import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AccountType } from './account-type.enum';

/**
 * One row in the chart of accounts. `isSystem` marks the seeded default
 * accounts (Cash, Accounts Receivable, Sales Revenue, etc. — see
 * `database/seed.ts`) that Journal Entries and Fixed Assets point to by
 * default; a system account can be renamed but never deleted or
 * deactivated (mirrors `Tax.type === SYSTEM_LOCKED`).
 */
@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Short human-facing account number, e.g. "1000" — unique, freely
   * editable (same relationship as a product's SKU or a customer's code). */
  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'enum', enum: AccountType })
  type: AccountType;

  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Account, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'parentId' })
  parent?: Account | null;

  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
