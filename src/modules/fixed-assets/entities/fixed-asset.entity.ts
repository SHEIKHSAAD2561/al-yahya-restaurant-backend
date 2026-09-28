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
import { decimalTransformer } from '../../../common/utils/decimal.transformer';
import { Account } from '../../chart-of-accounts/account.entity';
import { Location } from '../../locations/location.entity';
import { FixedAssetStatus } from '../fixed-asset-status.enum';
import { FixedAssetDepreciationEntry } from './fixed-asset-depreciation-entry.entity';

/**
 * A registered fixed asset — straight-line depreciation only (`monthlyDepreciation
 * = (purchaseCost − salvageValue) / usefulLifeMonths`), no double-declining or
 * units-of-production methods, a deliberate v1 scope match with how simple
 * `Expense.category` and other "reasonable standard record" entities in this
 * codebase are kept. Accumulated depreciation is derived from
 * `FixedAssetDepreciationEntry` rows, never stored redundantly.
 */
@Entity('fixed_assets')
export class FixedAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @Column({ type: 'uuid', nullable: true })
  locationId: string | null;

  @ManyToOne(() => Location, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'locationId' })
  location?: Location | null;

  /** The ASSET-type account this asset's cost is carried under (e.g. "Fixed
   * Assets"). */
  @Column({ type: 'uuid' })
  assetAccountId: string;

  @ManyToOne(() => Account, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assetAccountId' })
  assetAccount?: Account;

  @Column({ type: 'uuid' })
  accumulatedDepreciationAccountId: string;

  @ManyToOne(() => Account, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'accumulatedDepreciationAccountId' })
  accumulatedDepreciationAccount?: Account;

  @Column({ type: 'uuid' })
  depreciationExpenseAccountId: string;

  @ManyToOne(() => Account, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'depreciationExpenseAccountId' })
  depreciationExpenseAccount?: Account;

  @Column({ type: 'date' })
  purchaseDate: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  purchaseCost: number;

  @Column({ type: 'int' })
  usefulLifeMonths: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  salvageValue: number;

  @Column({
    type: 'enum',
    enum: FixedAssetStatus,
    default: FixedAssetStatus.ACTIVE,
  })
  status: FixedAssetStatus;

  @Column({ type: 'date', nullable: true })
  disposedAt: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => FixedAssetDepreciationEntry, (entry) => entry.fixedAsset)
  depreciationEntries: FixedAssetDepreciationEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
