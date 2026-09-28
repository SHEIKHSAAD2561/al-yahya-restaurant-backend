import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { DiscountType, SellAt } from '../sale-enums';
import { CheckoutLineDto } from './checkout-line.dto';

export class ParkSaleDto {
  /** Re-parks (updates) an already-parked sale instead of creating a new one. */
  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id?: string;

  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  registerId: string;

  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  customerId?: string;

  @IsEnum(SellAt, { message: i18nValidationMessage('validation.IS_ENUM') })
  sellAt: SellAt;

  @IsOptional()
  @IsEnum(DiscountType, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  discountType?: DiscountType;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  discountValue?: number;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(500)
  note?: string;

  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.ARRAY_MIN_SIZE'),
  })
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CheckoutLineDto)
  lines: CheckoutLineDto[];
}
