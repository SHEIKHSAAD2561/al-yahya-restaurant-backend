import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import {
  PromotionDiscountType,
  PromotionTargetType,
  PromotionType,
} from '../promotion.enums';

const MAX_AMOUNT = 999_999;

export class CreatePromotionDto {
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(150)
  name: string;

  @IsEnum(PromotionType, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  type: PromotionType;

  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  isActive?: boolean;

  @IsDateString({}, { message: i18nValidationMessage('validation.IS_STRING') })
  startAt: string;

  @IsOptional()
  @IsDateString({}, { message: i18nValidationMessage('validation.IS_STRING') })
  endAt?: string | null;

  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  applyToAllLocations: boolean;

  @ValidateIf((dto: CreatePromotionDto) => dto.applyToAllLocations === false)
  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.ARRAY_MIN_SIZE'),
  })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IS_UUID'),
  })
  locationIds?: string[];

  // ---- DISCOUNT_OFF_PRODUCTS ----
  @ValidateIf(
    (dto: CreatePromotionDto) =>
      dto.type === PromotionType.DISCOUNT_OFF_PRODUCTS,
  )
  @IsEnum(PromotionTargetType, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  targetType?: PromotionTargetType;

  @ValidateIf(
    (dto: CreatePromotionDto) =>
      dto.type === PromotionType.DISCOUNT_OFF_PRODUCTS &&
      dto.targetType === PromotionTargetType.SPECIFIC_PRODUCTS,
  )
  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.ARRAY_MIN_SIZE'),
  })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IS_UUID'),
  })
  targetVariantIds?: string[];

  @ValidateIf(
    (dto: CreatePromotionDto) =>
      dto.type === PromotionType.DISCOUNT_OFF_PRODUCTS &&
      dto.targetType === PromotionTargetType.CATEGORIES,
  )
  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.ARRAY_MIN_SIZE'),
  })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IS_UUID'),
  })
  targetCategoryIds?: string[];

  @ValidateIf(
    (dto: CreatePromotionDto) =>
      dto.type === PromotionType.DISCOUNT_OFF_PRODUCTS,
  )
  @IsEnum(PromotionDiscountType, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  discountType?: PromotionDiscountType;

  @ValidateIf(
    (dto: CreatePromotionDto) =>
      dto.type === PromotionType.DISCOUNT_OFF_PRODUCTS,
  )
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(MAX_AMOUNT, { message: i18nValidationMessage('validation.MAX') })
  discountValue?: number;

  // ---- BUY_X_GET_Y ----
  @ValidateIf(
    (dto: CreatePromotionDto) => dto.type === PromotionType.BUY_X_GET_Y,
  )
  @IsInt({ message: i18nValidationMessage('validation.IS_NUMBER') })
  @Min(1, { message: i18nValidationMessage('validation.MIN') })
  buyQuantity?: number;

  @ValidateIf(
    (dto: CreatePromotionDto) => dto.type === PromotionType.BUY_X_GET_Y,
  )
  @IsEnum(PromotionTargetType, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  buyTargetType?: PromotionTargetType;

  @ValidateIf(
    (dto: CreatePromotionDto) =>
      dto.type === PromotionType.BUY_X_GET_Y &&
      dto.buyTargetType === PromotionTargetType.SPECIFIC_PRODUCTS,
  )
  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.ARRAY_MIN_SIZE'),
  })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IS_UUID'),
  })
  buyVariantIds?: string[];

  @ValidateIf(
    (dto: CreatePromotionDto) =>
      dto.type === PromotionType.BUY_X_GET_Y &&
      dto.buyTargetType === PromotionTargetType.CATEGORIES,
  )
  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.ARRAY_MIN_SIZE'),
  })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IS_UUID'),
  })
  buyCategoryIds?: string[];

  @ValidateIf(
    (dto: CreatePromotionDto) => dto.type === PromotionType.BUY_X_GET_Y,
  )
  @IsInt({ message: i18nValidationMessage('validation.IS_NUMBER') })
  @Min(1, { message: i18nValidationMessage('validation.MIN') })
  getQuantity?: number;

  @ValidateIf(
    (dto: CreatePromotionDto) => dto.type === PromotionType.BUY_X_GET_Y,
  )
  @IsEnum(PromotionTargetType, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  getTargetType?: PromotionTargetType;

  @ValidateIf(
    (dto: CreatePromotionDto) =>
      dto.type === PromotionType.BUY_X_GET_Y &&
      dto.getTargetType === PromotionTargetType.SPECIFIC_PRODUCTS,
  )
  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.ARRAY_MIN_SIZE'),
  })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IS_UUID'),
  })
  getVariantIds?: string[];

  @ValidateIf(
    (dto: CreatePromotionDto) =>
      dto.type === PromotionType.BUY_X_GET_Y &&
      dto.getTargetType === PromotionTargetType.CATEGORIES,
  )
  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.ARRAY_MIN_SIZE'),
  })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IS_UUID'),
  })
  getCategoryIds?: string[];

  @ValidateIf(
    (dto: CreatePromotionDto) => dto.type === PromotionType.BUY_X_GET_Y,
  )
  @IsEnum(PromotionDiscountType, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  getDiscountType?: PromotionDiscountType;

  @ValidateIf(
    (dto: CreatePromotionDto) => dto.type === PromotionType.BUY_X_GET_Y,
  )
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(MAX_AMOUNT, { message: i18nValidationMessage('validation.MAX') })
  getDiscountValue?: number;
}
