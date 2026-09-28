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
import { ReturnInvoiceLineDto } from './return-invoice-line.dto';
import { ReturnInvoiceStatus } from '../return-invoice-status.enum';

export class CreateReturnInvoiceDto {
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  supplierId: string;

  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  locationId: string;

  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  purchaseInvoiceId?: string | null;

  @IsDateString({}, { message: i18nValidationMessage('validation.IS_STRING') })
  returnDate: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  notes?: string;

  @IsOptional()
  @IsEnum(ReturnInvoiceStatus, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  status?: ReturnInvoiceStatus;

  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.ARRAY_MIN_SIZE'),
  })
  @ValidateNested({ each: true })
  @Type(() => ReturnInvoiceLineDto)
  lines: ReturnInvoiceLineDto[];
}
