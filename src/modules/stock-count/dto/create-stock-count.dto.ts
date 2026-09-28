import { IsDateString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateStockCountDto {
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  locationId: string;

  @IsDateString({}, { message: i18nValidationMessage('validation.IS_STRING') })
  countDate: string;
}
