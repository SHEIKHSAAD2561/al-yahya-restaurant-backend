import { IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { AccountType } from '../account-type.enum';

export class QueryAccountsDto {
  @IsOptional()
  @IsEnum(AccountType, { message: i18nValidationMessage('validation.IS_ENUM') })
  type?: AccountType;

  @IsOptional()
  search?: string;
}
