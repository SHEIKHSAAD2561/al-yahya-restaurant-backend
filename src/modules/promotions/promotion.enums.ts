/** The two creation flows on the Promotions page. */
export enum PromotionType {
  DISCOUNT_OFF_PRODUCTS = 'DISCOUNT_OFF_PRODUCTS',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
}

/** What a discount (or a Buy X Get Y side) targets. */
export enum PromotionTargetType {
  ALL_PRODUCTS = 'ALL_PRODUCTS',
  SPECIFIC_PRODUCTS = 'SPECIFIC_PRODUCTS',
  CATEGORIES = 'CATEGORIES',
}

export enum PromotionDiscountType {
  PERCENT = 'PERCENT',
  AMOUNT = 'AMOUNT',
}
