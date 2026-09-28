import { IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CheckoutLineDto {
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  variantId: string;

  @IsNumber(
    { maxDecimalPlaces: 3 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0.001, { message: i18nValidationMessage('validation.MIN') })
  @Max(1_000_000, { message: i18nValidationMessage('validation.MAX') })
  quantity: number;

  /** Only honoured for a caller with `pos.edit_prices_discounts` — rejected
   * outright otherwise (see SalesService.resolveLine()). */
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(9_999_999, { message: i18nValidationMessage('validation.MAX') })
  unitPriceOverride?: number;
}
