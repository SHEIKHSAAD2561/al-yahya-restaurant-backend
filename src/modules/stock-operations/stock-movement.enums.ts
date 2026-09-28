/** A manual stock-in/stock-out voucher — Home dashboard's "Stock Operations"
 * nav item. Not tied to a purchase or sale (those already move stock on
 * their own confirm/checkout) — this is for damage write-offs, opening
 * balances, found stock, etc. */
export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
}

/** Same DRAFT/CONFIRMED split as Purchase/Return invoices — a draft can be
 * edited/deleted freely, confirming is permanent and is the point stock
 * actually moves. */
export enum StockMovementStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
}
