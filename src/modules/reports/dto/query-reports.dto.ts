import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export const REPORT_PERIODS = [7, 30, 90] as const;

export class QueryReportsDto {
  @IsOptional()
  @Type(() => Number)
  @IsIn(REPORT_PERIODS, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  days?: (typeof REPORT_PERIODS)[number];

  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  locationId?: string;
}
