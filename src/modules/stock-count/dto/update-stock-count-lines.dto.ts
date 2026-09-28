import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

class StockCountLineUpdateDto {
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id: string;

  @IsNumber(
    { maxDecimalPlaces: 3 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  countedQuantity: number;
}

export class UpdateStockCountLinesDto {
  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.ARRAY_MIN_SIZE'),
  })
  @ValidateNested({ each: true })
  @Type(() => StockCountLineUpdateDto)
  lines: StockCountLineUpdateDto[];
}
