/**
 * SYSTEM_LOCKED: seeded, always active, can't be deactivated or edited
 * (e.g. "Not Subject to Tax", "VAT" — the mandatory KSA baseline).
 * SYSTEM_TOGGLABLE: seeded, starts inactive, can be activated/deactivated
 * but not edited (e.g. "VAT + Tobacco Tax" — an optional regulatory scheme).
 * CUSTOM: created by a user through the Add Tax form — always active, no
 * activate/deactivate control, freely editable.
 */
export enum TaxType {
  SYSTEM_LOCKED = 'SYSTEM_LOCKED',
  SYSTEM_TOGGLABLE = 'SYSTEM_TOGGLABLE',
  CUSTOM = 'CUSTOM',
}
