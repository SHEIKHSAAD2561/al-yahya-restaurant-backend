import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

const MAX_AMOUNT = 9_999_999_999;

/** One row of the products-list "Bulk Edit Products Info" screen. Every
 * field is optional/nullable — only the fields the caller actually toggled
 * on ("Select fields to edit") are sent, and only those are touched. */
export class BulkPricingItemDto {
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  variantId: string;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(MAX_AMOUNT, { message: i18nValidationMessage('validation.MAX') })
  retailPrice?: number | null;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(MAX_AMOUNT, { message: i18nValidationMessage('validation.MAX') })
  wholesalePrice?: number | null;

  /** Ignored without `products.view_cost`, and always for a COMPOSITE variant
   * (its cost is derived, never a stored buy price). */
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(MAX_AMOUNT, { message: i18nValidationMessage('validation.MAX') })
  buyPrice?: number | null;

  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  taxId?: string | null;

  /** Applies to the variant's *product* (not the row), and is ignored for
   * COMPOSITE (which has no re-order point — see Product entity). */
  @IsOptional()
  @IsInt({ message: i18nValidationMessage('validation.IS_NUMBER') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(1_000_000, { message: i18nValidationMessage('validation.MAX') })
  reorderPoint?: number | null;
}

export class BulkUpdatePricingDto {
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  locationId: string;

  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.ARRAY_MIN_SIZE'),
  })
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => BulkPricingItemDto)
  items: BulkPricingItemDto[];
}
