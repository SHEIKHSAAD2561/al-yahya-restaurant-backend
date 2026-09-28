import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ProductType } from '../product-type.enum';
import { ProductOptionDto } from './product-option.dto';
import { ProductVariantDto } from './product-variant.dto';
import { CompositeComponentDto } from './composite-component.dto';

export const MAX_PRODUCT_IMAGES = 30;

/**
 * One payload for all three product types — `ProductsService` enforces the
 * per-type shape (variant count, options, components). The form always sends
 * the whole product, so updates reuse this minus `type` (see UpdateProductDto).
 */
export class CreateProductDto {
  @IsEnum(ProductType, { message: i18nValidationMessage('validation.IS_ENUM') })
  type: ProductType;

  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  isSellable?: boolean;

  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  isPurchasable?: boolean;

  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  trackQuantity?: boolean;

  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  isWeighted?: boolean;

  @IsOptional()
  @IsInt({ message: i18nValidationMessage('validation.IS_NUMBER') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(1_000_000, { message: i18nValidationMessage('validation.MAX') })
  reorderPoint?: number | null;

  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  categoryId?: string | null;

  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  brandId?: string | null;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 3 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(1_000_000, { message: i18nValidationMessage('validation.MAX') })
  shippingWeight?: number | null;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(1_000_000, { message: i18nValidationMessage('validation.MAX') })
  shippingLength?: number | null;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(1_000_000, { message: i18nValidationMessage('validation.MAX') })
  shippingWidth?: number | null;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(1_000_000, { message: i18nValidationMessage('validation.MAX') })
  shippingHeight?: number | null;

  /** Already-uploaded URLs (POST /products/images), first = thumbnail. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_PRODUCT_IMAGES)
  @IsUrl(
    {},
    { each: true, message: i18nValidationMessage('validation.IS_URL') },
  )
  imageUrls?: string[];

  /** VARIABLE only (1–3 options). */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => ProductOptionDto)
  options?: ProductOptionDto[];

  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.ARRAY_MIN_SIZE'),
  })
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants: ProductVariantDto[];

  /** COMPOSITE only. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CompositeComponentDto)
  components?: CompositeComponentDto[];
}
