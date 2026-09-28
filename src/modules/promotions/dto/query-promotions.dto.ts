import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export const PROMOTION_STATUS_FILTERS = [
  'SCHEDULED',
  'ACTIVE',
  'EXPIRED',
  'INACTIVE',
] as const;

export class QueryPromotionsDto {
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  search?: string;

  @IsOptional()
  @IsIn(PROMOTION_STATUS_FILTERS, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  status?: (typeof PROMOTION_STATUS_FILTERS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.IS_NUMBER') })
  @Min(1, { message: i18nValidationMessage('validation.MIN') })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.IS_NUMBER') })
  @Min(1, { message: i18nValidationMessage('validation.MIN') })
  @Max(100, { message: i18nValidationMessage('validation.MAX') })
  pageSize?: number;
}
