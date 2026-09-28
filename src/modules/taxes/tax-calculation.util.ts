/**
 * Shared by anything that needs to actually charge tax (POS checkout today;
 * reporting later) — mirrors the effective-rate formula documented on the Tax
 * entity: `hasCompoundTax` applies `compoundRate` on top of the lines'
 * subtotal (tax-on-tax), not a flat sum of every rate.
 */
export function effectiveTaxRate(tax: {
  hasCompoundTax: boolean;
  compoundRate: number | null;
  lines: { rate: number }[];
}): number {
  const linesRate = tax.lines.reduce((sum, line) => sum + line.rate, 0);
  if (!tax.hasCompoundTax || tax.compoundRate === null) {
    return linesRate;
  }
  return linesRate + tax.compoundRate + (linesRate * tax.compoundRate) / 100;
}

export interface LineTaxBreakdown {
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * `sellTaxStatus` decides whether `unitPrice` already includes tax:
 * - EXCLUSIVE: unitPrice excludes tax → total = subtotal + tax.
 * - INCLUSIVE: unitPrice includes tax → subtotal is backed out of total.
 */
export function computeLineTax(
  unitPrice: number,
  quantity: number,
  taxRate: number,
  sellTaxStatus: 'INCLUSIVE' | 'EXCLUSIVE',
): LineTaxBreakdown {
  const round = (value: number) => Math.round(value * 100) / 100;

  if (sellTaxStatus === 'INCLUSIVE') {
    const total = round(unitPrice * quantity);
    const subtotal = round(total / (1 + taxRate / 100));
    return { subtotal, tax: round(total - subtotal), total };
  }

  const subtotal = round(unitPrice * quantity);
  const tax = round((subtotal * taxRate) / 100);
  return { subtotal, tax, total: round(subtotal + tax) };
}
