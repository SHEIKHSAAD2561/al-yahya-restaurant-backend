import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ExpenseCategory } from '../expense-category.enum';

export class QueryExpensesDto {
  @IsOptional()
  @IsDateString({}, { message: i18nValidationMessage('validation.IS_STRING') })
  dateFrom?: string;

  @IsOptional()
  @IsDateString({}, { message: i18nValidationMessage('validation.IS_STRING') })
  dateTo?: string;

  @IsOptional()
  @IsEnum(ExpenseCategory, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  category?: ExpenseCategory;

  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  locationId?: string;

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
