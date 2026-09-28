/** Codes of the seeded system taxes (see database/seed.ts) — the stable way
 * to find a specific system tax, since ids differ per database. */
export const SYSTEM_TAX_CODES = {
  NOT_SUBJECT_TO_TAX: 'VATEX-SA-OOS',
  VAT: 'S',
  VAT_TOBACCO: 'ST',
} as const;
