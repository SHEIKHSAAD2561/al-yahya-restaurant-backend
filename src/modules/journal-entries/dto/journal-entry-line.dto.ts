import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class JournalEntryLineDto {
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  accountId: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(9_999_999, { message: i18nValidationMessage('validation.MAX') })
  debit: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(9_999_999, { message: i18nValidationMessage('validation.MAX') })
  credit: number;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(255)
  description?: string;
}
