import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * No reference screenshot was available for the Supplier form specifically
 * (unlike Customer, which mirrors a KSA tax-invoice address block shown in
 * the reference) — this is a reasonable, standard supplier record rather
 * than a verbatim match to something shown. Balance/credit isn't a stored
 * column: `SuppliersService.balance()` derives it from purchase invoices,
 * returns, and payments, the same "derive, don't duplicate" approach as
 * Customer's totalPaid.
 */
@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  vatNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
