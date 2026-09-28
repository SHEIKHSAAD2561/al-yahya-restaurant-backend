import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { DenominationDto } from './denomination.dto';

export class PaymentMethodCountDto {
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  paymentMethodId: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  countedAmount: number;

  /** Only meaningful for the register's cash-type payment method. */
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => DenominationDto)
  denominations: DenominationDto[];
}

/** One count per payment method assigned to the register — every assigned
 * method must be reconciled, not just cash. */
export class CloseRegisterDto {
  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.ARRAY_MIN_SIZE'),
  })
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PaymentMethodCountDto)
  counts: PaymentMethodCountDto[];
}
