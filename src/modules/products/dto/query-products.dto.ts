import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ProductType } from '../product-type.enum';

export const PRODUCT_SORTS = [
  'CREATED_DESC',
  'CREATED_ASC',
  'NAME_ASC',
  'NAME_DESC',
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export class QueryProductsDto {
  /** Matches product name, variant SKU, or barcode. */
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  search?: string;

  @IsOptional()
  @IsEnum(ProductType, { message: i18nValidationMessage('validation.IS_ENUM') })
  type?: ProductType;

  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  categoryId?: string;

  /** Category Management's "Uncategorized" bucket — mutually exclusive with
   * `categoryId` (categoryId wins if both are somehow sent). */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  uncategorized?: boolean;

  /** For the composite form's component picker — composites can't nest. */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  excludeComposite?: boolean;

  @IsOptional()
  @IsIn(PRODUCT_SORTS, { message: i18nValidationMessage('validation.IS_ENUM') })
  sort?: ProductSort;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.IS_NUMBER') })
  @Min(1, { message: i18nValidationMessage('validation.MIN') })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.IS_NUMBER') })
  @Min(1, { message: i18nValidationMessage('validation.MIN') })
  @Max(100, { message: i18nValidationMessage('validation.MAX') })
  pageSize?: number;
}
