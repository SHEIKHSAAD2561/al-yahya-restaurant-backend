import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FixedAsset } from './fixed-asset.entity';
import { JournalEntry } from '../../journal-entries/entities/journal-entry.entity';
import { decimalTransformer } from '../../../common/utils/decimal.transformer';

/** One posted depreciation run for one asset for one period — `periodDate`
 * is unique per asset (see `FixedAssetsService.recordDepreciation()`'s
 * duplicate-period guard) so the same month can't be posted twice. */
@Entity('fixed_asset_depreciation_entries')
export class FixedAssetDepreciationEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  fixedAssetId: string;

  @ManyToOne(() => FixedAsset, (asset) => asset.depreciationEntries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fixedAssetId' })
  fixedAsset?: FixedAsset;

  @Column({ type: 'uuid' })
  journalEntryId: string;

  @ManyToOne(() => JournalEntry, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'journalEntryId' })
  journalEntry?: JournalEntry;

  @Column({ type: 'date' })
  periodDate: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;
}
