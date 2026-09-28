import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Settings → Sale Settings → Sales tab. Single-tenant, so exactly one row —
 * see `SaleSettingsService.findOrCreate()`, same pattern as `Configuration`.
 * All flags default off; the ones with real enforcement elsewhere are noted
 * on each column.
 */
@Entity('sale_settings')
export class SaleSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'boolean', default: false })
  allowSalesman: boolean;

  @Column({ type: 'boolean', default: false })
  allowQuotation: boolean;

  @Column({ type: 'boolean', default: false })
  activateKitchenTicket: boolean;

  /** Enforced in `SalesService.applyStockDeductions()` — when true, checkout
   * no longer rejects a line whose stock would go to or below zero. */
  @Column({ type: 'boolean', default: false })
  sellWhenQuantityZeroOrBelow: boolean;

  @Column({ type: 'boolean', default: false })
  sellBelowCost: boolean;

  @Column({ type: 'boolean', default: false })
  taxableInvoiceB2b: boolean;

  @Column({ type: 'boolean', default: false })
  numberDialog: boolean;

  @Column({ type: 'boolean', default: false })
  enableWhatsappMessages: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
