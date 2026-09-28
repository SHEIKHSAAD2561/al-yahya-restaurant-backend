import { IsNumber, IsUUID, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class StockTransferLineDto {
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  variantId: string;

  @IsNumber(
    { maxDecimalPlaces: 3 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0.001, { message: i18nValidationMessage('validation.MIN') })
  @Max(9_999_999, { message: i18nValidationMessage('validation.MAX') })
  quantity: number;
}
