import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { StockTransferLineDto } from './stock-transfer-line.dto';

export class CreateStockTransferDto {
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  fromLocationId: string;

  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  toLocationId: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(255)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.ARRAY_MIN_SIZE'),
  })
  @ValidateNested({ each: true })
  @Type(() => StockTransferLineDto)
  lines: StockTransferLineDto[];
}
