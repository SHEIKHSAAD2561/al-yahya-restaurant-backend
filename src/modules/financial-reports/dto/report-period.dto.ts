import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AsOfDto {
  @IsOptional()
  @IsDateString({}, { message: i18nValidationMessage('validation.IS_STRING') })
  asOf?: string;
}

export class DateRangeDto {
  @IsOptional()
  @IsDateString({}, { message: i18nValidationMessage('validation.IS_STRING') })
  dateFrom?: string;

  @IsOptional()
  @IsDateString({}, { message: i18nValidationMessage('validation.IS_STRING') })
  dateTo?: string;
}

export class GeneralLedgerQueryDto extends DateRangeDto {
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  accountId: string;
}
