import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReceiptLanguage, ReceiptPrintLayout } from './receipt-settings.enums';

/**
 * Settings → Sale Settings → Receipts tab. Single-tenant, so exactly one row
 * — see `ReceiptSettingsService.findOrCreate()`, same pattern as
 * `Configuration`/`SaleSettings`. Only one print template exists today (like
 * Registers' `sellLayout`), so there's no `templateId` column — the frontend
 * shows a single, non-editable "Default" option rather than a real picker.
 *
 * Every `show*` column is one checkbox in the Receipt Content Editor, grouped
 * into Header / Items Content / Footer sections on the frontend; `salesNote`
 * and `commentImageUrl` are the free-text note and uploaded image shown at
 * the bottom of the receipt.
 */
@Entity('receipt_settings')
export class ReceiptSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ---- Header ----
  @Column({ type: 'boolean', default: true })
  showLogo: boolean;

  @Column({ type: 'boolean', default: true })
  showCompanyName: boolean;

  @Column({ type: 'boolean', default: true })
  showCompanyAddress: boolean;

  @Column({ type: 'boolean', default: true })
  showCompanyPhone: boolean;

  @Column({ type: 'boolean', default: true })
  showVatNumber: boolean;

  @Column({ type: 'boolean', default: false })
  showCrNumber: boolean;

  // ---- Items Content ----
  @Column({ type: 'boolean', default: false })
  showSku: boolean;

  @Column({ type: 'boolean', default: false })
  showBarcode: boolean;

  @Column({ type: 'boolean', default: true })
  showQuantity: boolean;

  @Column({ type: 'boolean', default: true })
  showUnitPrice: boolean;

  @Column({ type: 'boolean', default: true })
  showDiscount: boolean;

  @Column({ type: 'boolean', default: false })
  showTaxPerLine: boolean;

  // ---- Footer ----
  @Column({ type: 'boolean', default: true })
  showSubtotal: boolean;

  @Column({ type: 'boolean', default: true })
  showTaxSummary: boolean;

  @Column({ type: 'boolean', default: true })
  showTotal: boolean;

  @Column({ type: 'boolean', default: true })
  showAmountPaid: boolean;

  @Column({ type: 'boolean', default: true })
  showChangeDue: boolean;

  @Column({ type: 'boolean', default: true })
  showPaymentMethod: boolean;

  @Column({ type: 'boolean', default: true })
  showCashierName: boolean;

  @Column({ type: 'boolean', default: true })
  showCustomerName: boolean;

  @Column({ type: 'boolean', default: false })
  showQrCode: boolean;

  @Column({ type: 'boolean', default: true })
  showThankYouNote: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  salesNote: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  commentImageUrl: string | null;

  @Column({
    type: 'enum',
    enum: ReceiptPrintLayout,
    default: ReceiptPrintLayout.THERMAL,
  })
  printLayout: ReceiptPrintLayout;

  @Column({ type: 'enum', enum: ReceiptLanguage, default: ReceiptLanguage.EN })
  language: ReceiptLanguage;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
