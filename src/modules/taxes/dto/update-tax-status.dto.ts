import { IsBoolean } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateTaxStatusDto {
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  isActive: boolean;
}
