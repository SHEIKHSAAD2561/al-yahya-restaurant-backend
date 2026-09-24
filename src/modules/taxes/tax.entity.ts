import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TaxLine } from './tax-line.entity';
import { TaxType } from './tax-type.enum';

const decimalTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value === undefined || value === null ? value : parseFloat(value)),
};

@Entity('taxes')
export class Tax {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  /** SYSTEM_LOCKED/SYSTEM_TOGGLABLE rows come only from the seed script
   * (see database/seed.ts) — the API never lets a caller set this, so every
   * tax created through `POST /taxes` is CUSTOM. */
  @Column({ type: 'enum', enum: TaxType, default: TaxType.CUSTOM })
  type: TaxType;

  /** When true, `compoundRate` applies on top of the subtotal of `lines`
   * (tax-on-tax) rather than the tax just being a flat sum of lines — e.g.
   * "VAT + Tobacco Tax": lines sum to a 100% subtotal (Tobacco Tax), and a
   * 15% compound VAT then applies on top of that, for a 130% effective rate. */
  @Column({ type: 'boolean', default: false })
  hasCompoundTax: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  compoundLabel: string | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true, transformer: decimalTransformer })
  compoundRate: number | null;

  /** Independent per tax — more than one can be active at once (e.g. a
   * standard VAT tax and a "not subject to tax" tax both active, assignable
   * per product later). */
  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @OneToMany(() => TaxLine, (line) => line.tax, { cascade: true })
  lines: TaxLine[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
