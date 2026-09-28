import { IsEnum } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { DimensionUnit, WeightUnit } from '../configuration.enums';

export class UpdateShippingConfigurationDto {
  @IsEnum(WeightUnit, { message: i18nValidationMessage('validation.IS_ENUM') })
  shippingWeightUnit: WeightUnit;

  @IsEnum(DimensionUnit, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  shippingDimensionUnit: DimensionUnit;
}
