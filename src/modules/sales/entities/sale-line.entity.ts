import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Sale } from './sale.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Tax } from '../../taxes/tax.entity';
import { decimalTransformer } from '../../../common/utils/decimal.transformer';

/** One product line of a sale — everything about the product is snapshotted
 * (name/sku/price/tax) at the moment it was added, so a later price or tax
 * change never rewrites an already-parked or already-completed sale. */
@Entity('sale_lines')
export class SaleLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  saleId: string;

  @ManyToOne(() => Sale, (sale) => sale.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale?: Sale;

  /** RESTRICT — a variant that's been sold can't be deleted out from under
   * the sale history. */
  @Column({ type: 'uuid' })
  variantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'variantId' })
  variant?: ProductVariant;

  @Column({ type: 'varchar', length: 200 })
  productName: string;

  @Column({ type: 'varchar', length: 50 })
  sku: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    transformer: decimalTransformer,
  })
  quantity: number;

  /** Snapshotted unit price (server-resolved, or the cashier's override —
   * see SalesService.resolveLine()). */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  unitPrice: number;

  /** Snapshotted cost at the moment of sale (weighted-average cost for a
   * SIMPLE/VARIABLE variant, Σ component cost×qty for a COMPOSITE) — powers
   * Dashboard/Reports' gross-profit figures without needing to look at the
   * product catalog's cost as it stands *today*. Nullable because sales
   * completed before this column existed have no cost snapshot to backfill. */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  unitCost: number | null;

  @Column({ type: 'uuid', nullable: true })
  taxId: string | null;

  @ManyToOne(() => Tax, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'taxId' })
  tax?: Tax | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  taxRate: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  lineSubtotal: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  lineTax: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  lineTotal: number;
}
