export enum TaxStatus {
  INCLUSIVE = 'INCLUSIVE',
  EXCLUSIVE = 'EXCLUSIVE',
}

export enum WeightUnit {
  KG = 'KG',
  G = 'G',
  LB = 'LB',
  OZ = 'OZ',
}

export enum DimensionUnit {
  CM = 'CM',
  M = 'M',
  FT = 'FT',
  IN = 'IN',
}

/** What the trailing digits of a weighted-product barcode encode. */
export enum BarcodeValueType {
  WEIGHT = 'WEIGHT',
  PRICE = 'PRICE',
}
