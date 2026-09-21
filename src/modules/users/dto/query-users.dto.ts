import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { UserStatus } from '../user-status.enum';

export class QueryUsersDto {
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  search?: string;

  @IsOptional()
  @IsUUID(undefined, { message: i18nValidationMessage('validation.IS_UUID') })
  roleId?: string;

  @IsOptional()
  @IsEnum(UserStatus, { message: i18nValidationMessage('validation.IS_ENUM') })
  status?: UserStatus;
}
