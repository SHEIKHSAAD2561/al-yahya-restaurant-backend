import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import {
  StockMovementStatus,
  StockMovementType,
} from '../stock-movement.enums';

export class QueryStockMovementsDto {
  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  locationId?: string;

  @IsOptional()
  @IsEnum(StockMovementType, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  type?: StockMovementType;

  @IsOptional()
  @IsEnum(StockMovementStatus, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  status?: StockMovementStatus;

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
