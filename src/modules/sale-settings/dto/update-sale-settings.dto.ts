import { IsBoolean } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateSaleSettingsDto {
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  allowSalesman: boolean;

  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  allowQuotation: boolean;

  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  activateKitchenTicket: boolean;

  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  sellWhenQuantityZeroOrBelow: boolean;

  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  sellBelowCost: boolean;

  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  taxableInvoiceB2b: boolean;

  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  numberDialog: boolean;

  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  enableWhatsappMessages: boolean;
}
