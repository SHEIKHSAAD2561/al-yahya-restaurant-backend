import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CashMovementType } from '../register-enums';

export class CreateCashMovementDto {
  @IsEnum(CashMovementType, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  type: CashMovementType;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0.01, { message: i18nValidationMessage('validation.MIN') })
  amount: number;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(255)
  reason?: string;
}
