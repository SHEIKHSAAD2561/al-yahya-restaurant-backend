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
import { User } from '../../users/user.entity';
import { JournalEntryLine } from './journal-entry-line.entity';
import { JournalEntryStatus } from '../journal-entry-status.enum';

/**
 * One double-entry journal entry — a `DRAFT` can be freely edited/deleted
 * and is excluded from every balance/report; posting (`POST .../:id/post`)
 * is permanent and validates Σdebit === Σcredit across its lines. A posted
 * entry is never edited or deleted, only reversed (`reversalOfEntryId` on
 * the new offsetting entry this creates) — same "confirm is final, undo via
 * a new counter-transaction" philosophy as Return Invoices reversing a
 * Purchase Invoice.
 */
@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** "JE{YYYYMMDD}-{n}" — assigned only at posting, same "no number until
   * it's real" convention as `Sale.invoiceNumber`. */
  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  entryNumber: string | null;

  @Column({ type: 'date' })
  entryDate: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  memo: string | null;

  @Column({
    type: 'enum',
    enum: JournalEntryStatus,
    default: JournalEntryStatus.DRAFT,
  })
  status: JournalEntryStatus;

  @Column({ type: 'uuid' })
  createdByUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User;

  @Column({ type: 'timestamp', nullable: true })
  postedAt: Date | null;

  /** Set only on the new reversing entry this creates — points back at the
   * original. The original is never modified when reversed. */
  @Column({ type: 'uuid', nullable: true })
  reversalOfEntryId: string | null;

  @ManyToOne(() => JournalEntry, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reversalOfEntryId' })
  reversalOfEntry?: JournalEntry | null;

  @OneToMany(() => JournalEntryLine, (line) => line.journalEntry, {
    cascade: true,
  })
  lines: JournalEntryLine[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
