import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { SellAt } from '../sale-enums';

export class QuerySalesDto {
  @IsOptional()
  @IsDateString({}, { message: i18nValidationMessage('validation.IS_STRING') })
  dateFrom?: string;

  @IsOptional()
  @IsDateString({}, { message: i18nValidationMessage('validation.IS_STRING') })
  dateTo?: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  invoiceNumber?: string;

  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  paymentMethodId?: string;

  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  locationId?: string;

  /** Cash Management's "Session Invoices" — every completed sale rung up
   * during one register session. */
  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  registerSessionId?: string;

  /** The Sale Invoices page's "Sale Type" filter — Retail vs Wholesale, the
   * only sale-type distinction that actually exists in this schema. */
  @IsOptional()
  @IsEnum(SellAt, { message: i18nValidationMessage('validation.IS_ENUM') })
  sellAt?: SellAt;

  /** Matches customer name, phone, or code. */
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  customerSearch?: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  productName?: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  productSku?: string;

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
