/** The 5 standard accounting categories. `normalBalance()` below is derived
 * from this, never stored — ASSET/EXPENSE accounts normally carry a debit
 * balance, LIABILITY/EQUITY/REVENUE a credit balance. */
export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export type NormalBalance = 'DEBIT' | 'CREDIT';

export function normalBalanceFor(type: AccountType): NormalBalance {
  return type === AccountType.ASSET || type === AccountType.EXPENSE ? 'DEBIT' : 'CREDIT';
}
