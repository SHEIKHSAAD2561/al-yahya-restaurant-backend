import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Language } from '../language.enum';

export class CreateUserDto {
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @MaxLength(150)
  nameEn: string;

  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @MaxLength(150)
  nameAr: string;

  @IsEmail({}, { message: i18nValidationMessage('validation.IS_EMAIL') })
  email: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(30)
  phone?: string;

  @IsUUID(undefined, { message: i18nValidationMessage('validation.IS_UUID') })
  roleId: string;

  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  allLocations?: boolean;

  @ValidateIf((dto: CreateUserDto) => dto.allLocations === false)
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, {
    each: true,
    message: i18nValidationMessage('validation.IS_UUID'),
  })
  locationIds?: string[];

  @IsOptional()
  @IsEnum(Language, { message: i18nValidationMessage('validation.IS_ENUM') })
  preferredLanguage?: Language;
}
