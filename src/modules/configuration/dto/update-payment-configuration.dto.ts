import { IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdatePaymentConfigurationDto {
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  defaultPaymentMethodId: string;
}
