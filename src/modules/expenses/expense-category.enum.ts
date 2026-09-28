/** A small, fixed set rather than a user-managed category list — matches
 * every reference to expense categories seen so far (Home/Reports' "Profit &
 * expenses summary": Rent, Staff salaries, Utility bills, Other expenses).
 * Revisit as a real many-to-one `ExpenseCategory` table if the user wants
 * custom categories later — not built that way now to avoid a management
 * screen nobody asked for. */
export enum ExpenseCategory {
  RENT = 'RENT',
  SALARIES = 'SALARIES',
  UTILITIES = 'UTILITIES',
  OTHER = 'OTHER',
}
