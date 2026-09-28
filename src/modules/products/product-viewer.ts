/**
 * What the calling user may see/set on a product, resolved once per request
 * from their permissions (and, for stock, their assigned locations):
 * - `products.view_cost` → cost and buy price (read and write).
 * - `stock.access` → quantities, only for the user's locations unless they
 *   have "all locations"; also required to set an initial quantity.
 * Everything else on a product only needs `products.access` to read.
 */
export interface ProductViewer {
  canViewCost: boolean;
  /** null = no stock visibility at all; 'all' = every location. */
  stockLocationIds: Set<string> | 'all' | null;
}

export function canSeeStockAt(
  viewer: ProductViewer,
  locationId: string,
): boolean {
  if (viewer.stockLocationIds === null) return false;
  return (
    viewer.stockLocationIds === 'all' || viewer.stockLocationIds.has(locationId)
  );
}
