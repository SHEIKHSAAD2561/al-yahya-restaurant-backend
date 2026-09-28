import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  BarcodeValueType,
  DimensionUnit,
  TaxStatus,
  WeightUnit,
} from './configuration.enums';

/**
 * Settings → Configuration. Single-tenant, so exactly one row — see
 * `ConfigurationService.findOrCreate()`. The default location is deliberately
 * *not* stored here: it's `Location.isDefault`, so there's one source of truth
 * shared with the Locations tab.
 */
@Entity('configuration')
export class Configuration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Plain id, no relation — must point at an active tax (checked in the
   * service; deactivating the tax that's set here is rejected by TaxesService). */
  @Column({ type: 'uuid', nullable: true })
  defaultTaxId: string | null;

  /** Forced to EXCLUSIVE while "VAT + Tobacco Tax" is active. Cost prices are
   * always tax-exclusive, so there's no matching cost column. */
  @Column({ type: 'enum', enum: TaxStatus, default: TaxStatus.EXCLUSIVE })
  sellTaxStatus: TaxStatus;

  @Column({ type: 'enum', enum: WeightUnit, default: WeightUnit.KG })
  weightUnit: WeightUnit;

  @Column({
    type: 'enum',
    enum: BarcodeValueType,
    default: BarcodeValueType.WEIGHT,
  })
  barcodeValueType: BarcodeValueType;

  /** GS1 in-store prefix (20–29) that marks a barcode as a weighted product. */
  @Column({ type: 'tinyint', unsigned: true, default: 21 })
  barcodePrefix: number;

  @Column({ type: 'boolean', default: false })
  barcodeHasCheckDigit: boolean;

  @Column({ type: 'enum', enum: WeightUnit, default: WeightUnit.KG })
  shippingWeightUnit: WeightUnit;

  @Column({ type: 'enum', enum: DimensionUnit, default: DimensionUnit.CM })
  shippingDimensionUnit: DimensionUnit;

  /** Plain id like `defaultTaxId` — payment methods can't be deleted, so it
   * can't dangle. Set to Cash on creation. */
  @Column({ type: 'uuid', nullable: true })
  defaultPaymentMethodId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
