import { IsEnum, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TaxStatus } from '../configuration.enums';

export class UpdateTaxConfigurationDto {
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  defaultTaxId: string;

  @IsEnum(TaxStatus, { message: i18nValidationMessage('validation.IS_ENUM') })
  sellTaxStatus: TaxStatus;
}
