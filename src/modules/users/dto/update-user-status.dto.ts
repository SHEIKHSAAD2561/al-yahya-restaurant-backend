import { IsIn } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { UserStatus } from '../user-status.enum';

export class UpdateUserStatusDto {
  @IsIn([UserStatus.ACTIVE, UserStatus.INACTIVE], {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  status: UserStatus.ACTIVE | UserStatus.INACTIVE;
}
