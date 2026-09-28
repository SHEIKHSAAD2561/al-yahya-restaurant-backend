import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { VariantLocationDto } from './variant-location.dto';

export class ProductVariantDto {
  /** Present when updating an existing variant; omitted for a new one. */
  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id?: string;

  /** VARIABLE only — one value per product option, in option order. */
  @IsOptional()
  @IsArray()
  @IsString({
    each: true,
    message: i18nValidationMessage('validation.IS_STRING'),
  })
  @ArrayMaxSize(3)
  optionValues?: string[] | null;

  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @MaxLength(50)
  sku: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(50)
  barcode?: string | null;

  /** Initial cost — honoured only when the variant is first created and the
   * caller has `products.view_cost`. Ignored for COMPOSITE (derived). */
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(9_999_999_999, { message: i18nValidationMessage('validation.MAX') })
  cost?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantLocationDto)
  locations: VariantLocationDto[];
}
