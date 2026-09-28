export enum SaleStatus {
  /** "Pause Sale" — a saved-for-later cart, not yet an invoice (no
   * `invoiceNumber` until it's completed). */
  PARKED = 'PARKED',
  COMPLETED = 'COMPLETED',
}

export enum SellAt {
  RETAIL = 'RETAIL',
  WHOLESALE = 'WHOLESALE',
}

export enum DiscountType {
  PERCENT = 'PERCENT',
  AMOUNT = 'AMOUNT',
}
