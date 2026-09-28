import { IsBoolean, IsEnum, IsInt, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { BarcodeValueType, WeightUnit } from '../configuration.enums';

export class UpdateWeightedProductConfigurationDto {
  @IsEnum(WeightUnit, { message: i18nValidationMessage('validation.IS_ENUM') })
  weightUnit: WeightUnit;

  @IsEnum(BarcodeValueType, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  barcodeValueType: BarcodeValueType;

  @IsInt({ message: i18nValidationMessage('validation.IS_NUMBER') })
  @Min(20, { message: i18nValidationMessage('validation.MIN') })
  @Max(29, { message: i18nValidationMessage('validation.MAX') })
  barcodePrefix: number;

  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  barcodeHasCheckDigit: boolean;
}
