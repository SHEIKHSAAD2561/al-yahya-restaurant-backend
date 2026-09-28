import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

const MAX_AMOUNT = 9_999_999;

export class CreateCustomerPaymentDto {
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  customerId: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0.01, { message: i18nValidationMessage('validation.MIN') })
  @Max(MAX_AMOUNT, { message: i18nValidationMessage('validation.MAX') })
  amount: number;

  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  paymentMethodId?: string | null;

  @IsDateString({}, { message: i18nValidationMessage('validation.IS_STRING') })
  paymentDate: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(255)
  notes?: string;
}
