import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PurchaseInvoiceLineDto } from './purchase-invoice-line.dto';
import { PurchaseInvoiceStatus } from '../purchase-invoice-status.enum';

export class CreatePurchaseInvoiceDto {
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  supplierId: string;

  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  locationId: string;

  @IsDateString({}, { message: i18nValidationMessage('validation.IS_STRING') })
  invoiceDate: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  notes?: string;

  /** Defaults to DRAFT — only `CONFIRMED` here (or a later `POST .../confirm`
   * call) actually moves stock/cost. */
  @IsOptional()
  @IsEnum(PurchaseInvoiceStatus, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  status?: PurchaseInvoiceStatus;

  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.ARRAY_MIN_SIZE'),
  })
  @ValidateNested({ each: true })
  @Type(() => PurchaseInvoiceLineDto)
  lines: PurchaseInvoiceLineDto[];
}
