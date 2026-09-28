/**
 * Fixed at creation — can't change after save (the stored shape differs).
 * SIMPLE: exactly one variant. VARIABLE: one variant per option combination.
 * COMPOSITE: exactly one variant, built from other products' variants (its
 * cost and sellable quantity are derived from those components, not stored).
 */
export enum ProductType {
  SIMPLE = 'SIMPLE',
  VARIABLE = 'VARIABLE',
  COMPOSITE = 'COMPOSITE',
}
