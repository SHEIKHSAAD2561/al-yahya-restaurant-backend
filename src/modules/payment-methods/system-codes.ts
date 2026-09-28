/** Stable identifiers for the rows the AddPaymentMethods migration (and
 * seed.ts) create — ids differ per database, these don't. */
export const SYSTEM_PAYMENT_METHOD_CODES = {
  CASH: 'CASH',
  CREDIT_CARD: 'CREDIT_CARD',
} as const;

export const SYSTEM_BANK_ACCOUNT_CODES = {
  OTHER_BANK_ACCOUNTS: 'OTHER_BANK_ACCOUNTS',
} as const;
