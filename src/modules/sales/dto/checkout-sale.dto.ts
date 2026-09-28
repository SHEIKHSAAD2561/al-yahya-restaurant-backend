import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ParkSaleDto } from './park-sale.dto';

/** Everything a parked sale has, plus payment. `id` here means "complete
 * this previously-parked sale" (same field, reused for the same reason). */
export class CheckoutSaleDto extends ParkSaleDto {
  /** "Pay Later" — bills the sale to `customerId` instead of collecting
   * payment now (`pos.checkout_post_payment`, see SalesService.checkout()).
   * `paymentMethodId`/`amountTendered` are meaningless in that case, so they
   * stop being required. */
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  isPostPayment?: boolean;

  @ValidateIf((dto: CheckoutSaleDto) => !dto.isPostPayment)
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  paymentMethodId?: string;

  @ValidateIf((dto: CheckoutSaleDto) => !dto.isPostPayment)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  amountTendered?: number;

  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  resumedFromSaleId?: string;
}
