/** DRAFT can still be edited/deleted freely and never touches stock or cost
 * — matches `purchases_suppliers.record_draft`. CONFIRMED is permanent (no
 * un-confirm, no edit, no delete — issue a Return Invoice instead) and is
 * the point stock/cost actually move — matches `purchases_suppliers.
 * manage_invoices`'s "record, modify, confirm, and delete" wording: modify
 * and delete apply only while still a draft. */
export enum PurchaseInvoiceStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
}
