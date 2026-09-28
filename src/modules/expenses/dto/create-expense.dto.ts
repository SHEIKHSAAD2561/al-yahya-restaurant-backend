import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ExpenseCategory } from '../expense-category.enum';

const MAX_AMOUNT = 9_999_999;

export class CreateExpenseDto {
  @IsEnum(ExpenseCategory, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  category: ExpenseCategory;

  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(255)
  description: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(MAX_AMOUNT, { message: i18nValidationMessage('validation.MAX') })
  amount: number;

  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  locationId?: string | null;

  @IsDateString({}, { message: i18nValidationMessage('validation.IS_STRING') })
  expenseDate: string;
}
