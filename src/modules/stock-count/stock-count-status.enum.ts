/** DRAFT: lines are pre-filled with each variant's current quantity at the
 * chosen location (`expectedQuantity`) and can be edited (`countedQuantity`)
 * freely. CONFIRMED (permanent): every counted line's `VariantLocation.
 * quantity` is set to match what was physically counted — an uncounted line
 * (`countedQuantity` still null) is left untouched, not zeroed out. */
export enum StockCountStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
}
