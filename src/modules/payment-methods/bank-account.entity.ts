import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** A deposit account a non-cash payment method settles into (the "Linked
 * Account" column on Settings → Payment Methods). */
@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  /** Required through the API; null only for the seeded catch-all account. */
  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  accountNumber: string | null;

  /** Set only on seeded rows — see system-codes.ts. */
  @Column({ type: 'varchar', length: 30, nullable: true, unique: true })
  systemCode: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
