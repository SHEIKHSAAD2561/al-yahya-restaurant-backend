export enum PrinterType {
  THERMAL = 'THERMAL',
  A4 = 'A4',
}

export enum RegisterSessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum CashMovementType {
  IN = 'IN',
  OUT = 'OUT',
}

/** Only one layout exists today — kept as an enum (not a free string) so a
 * second one slots in later without a data migration. Not user-selectable
 * yet; every register gets this value. */
export enum SellLayout {
  QUICK_SALE = 'QUICK_SALE',
}
