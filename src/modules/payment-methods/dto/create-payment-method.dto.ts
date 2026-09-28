import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaymentMethodType } from '../payment-method-type.enum';

export class CreatePaymentMethodDto {
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @MaxLength(100)
  name: string;

  @IsEnum(PaymentMethodType, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  type: PaymentMethodType;

  /** Required for every type except CASH (checked in the service, since it
   * depends on the resulting type on update too). */
  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  bankAccountId?: string | null;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(255)
  description?: string | null;
}
