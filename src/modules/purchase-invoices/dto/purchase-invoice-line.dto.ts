import { IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

const MAX_AMOUNT = 9_999_999;

export class PurchaseInvoiceLineDto {
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  variantId: string;

  @IsNumber(
    { maxDecimalPlaces: 3 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0.001, { message: i18nValidationMessage('validation.MIN') })
  @Max(MAX_AMOUNT, { message: i18nValidationMessage('validation.MAX') })
  quantity: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(MAX_AMOUNT, { message: i18nValidationMessage('validation.MAX') })
  unitCost: number;

  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  taxId?: string | null;
}
