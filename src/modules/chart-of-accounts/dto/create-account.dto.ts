import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { AccountType } from '../account-type.enum';

export class CreateAccountDto {
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(20)
  code: string;

  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(150)
  name: string;

  @IsEnum(AccountType, { message: i18nValidationMessage('validation.IS_ENUM') })
  type: AccountType;

  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  parentId?: string | null;
}
