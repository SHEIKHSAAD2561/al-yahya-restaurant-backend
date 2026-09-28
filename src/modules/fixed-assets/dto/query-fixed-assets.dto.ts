import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { FixedAssetStatus } from '../fixed-asset-status.enum';

export class QueryFixedAssetsDto {
  @IsOptional()
  @IsEnum(FixedAssetStatus, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  status?: FixedAssetStatus;

  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  locationId?: string;
}
