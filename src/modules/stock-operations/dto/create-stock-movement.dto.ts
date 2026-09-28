import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { StockMovementLineDto } from './stock-movement-line.dto';
import {
  StockMovementStatus,
  StockMovementType,
} from '../stock-movement.enums';

export class CreateStockMovementDto {
  @IsEnum(StockMovementType, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  type: StockMovementType;

  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  locationId: string;

  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(255)
  reason: string;

  @IsDateString({}, { message: i18nValidationMessage('validation.IS_STRING') })
  movementDate: string;

  @IsOptional()
  @IsEnum(StockMovementStatus, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  status?: StockMovementStatus;

  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.ARRAY_MIN_SIZE'),
  })
  @ValidateNested({ each: true })
  @Type(() => StockMovementLineDto)
  lines: StockMovementLineDto[];
}
