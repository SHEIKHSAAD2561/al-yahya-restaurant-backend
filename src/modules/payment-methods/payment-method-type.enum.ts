/** CASH never has a linked bank account; every other type must have one
 * (it's where that money is deposited). */
export enum PaymentMethodType {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  OTHER = 'OTHER',
}
