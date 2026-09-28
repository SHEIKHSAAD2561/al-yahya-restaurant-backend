import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CreateAccountDto } from './create-account.dto';

/** `type` can't change after creation — it drives normal-balance and
 * every report's grouping; retyping an account with existing journal lines
 * would silently corrupt the trial balance / balance sheet. Rename or
 * re-parent instead, or deactivate and create a new one. */
export class UpdateAccountDto extends PartialType(
  OmitType(CreateAccountDto, ['type'] as const),
) {
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  isActive?: boolean;
}
