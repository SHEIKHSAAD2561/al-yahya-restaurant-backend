import { IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

const MAX_AMOUNT = 9_999_999_999;

export class VariantLocationDto {
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  locationId: string;

  /** Initial quantity — honoured only when the variant is first created and
   * the caller has `stock.access`; ignored otherwise (stock operations own it). */
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 3 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(MAX_AMOUNT, { message: i18nValidationMessage('validation.MAX') })
  quantity?: number;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(MAX_AMOUNT, { message: i18nValidationMessage('validation.MAX') })
  retailPrice?: number | null;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(MAX_AMOUNT, { message: i18nValidationMessage('validation.MAX') })
  wholesalePrice?: number | null;

  /** Ignored without `products.view_cost`. */
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(MAX_AMOUNT, { message: i18nValidationMessage('validation.MAX') })
  buyPrice?: number | null;

  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  taxId?: string | null;
}
