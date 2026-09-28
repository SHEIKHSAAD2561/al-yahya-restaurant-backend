/** Same DRAFT/CONFIRMED split as `PurchaseInvoiceStatus` — a draft can be
 * edited/deleted freely, confirming is permanent and is the point stock
 * actually leaves. */
export enum ReturnInvoiceStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
}
