import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateFixedAssetDto {
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  locationId?: string | null;

  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  assetAccountId: string;

  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  accumulatedDepreciationAccountId: string;

  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  depreciationExpenseAccountId: string;

  @IsDateString({}, { message: i18nValidationMessage('validation.IS_STRING') })
  purchaseDate: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0.01, { message: i18nValidationMessage('validation.MIN') })
  @Max(99_999_999, { message: i18nValidationMessage('validation.MAX') })
  purchaseCost: number;

  @IsInt({ message: i18nValidationMessage('validation.IS_NUMBER') })
  @Min(1, { message: i18nValidationMessage('validation.MIN') })
  @Max(1200, { message: i18nValidationMessage('validation.MAX') })
  usefulLifeMonths: number;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  salvageValue?: number;

  /** If set, immediately posts a purchase journal entry (debit the asset
   * account, credit this one — e.g. Cash or Accounts Payable) for
   * `purchaseCost`. Omit to register the asset without an accounting entry
   * (e.g. it was already recorded another way, or this is historical data
   * being migrated in). */
  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  paymentAccountId?: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  notes?: string;
}
