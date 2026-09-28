import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ProductOptionDto {
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @MaxLength(50)
  name: string;

  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.ARRAY_MIN_SIZE'),
  })
  @ArrayMaxSize(50)
  @IsString({
    each: true,
    message: i18nValidationMessage('validation.IS_STRING'),
  })
  @IsNotEmpty({
    each: true,
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @MaxLength(50, { each: true })
  values: string[];
}
