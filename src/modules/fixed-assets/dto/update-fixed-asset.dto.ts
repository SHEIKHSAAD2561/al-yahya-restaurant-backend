import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateFixedAssetDto } from './create-fixed-asset.dto';

/** `purchaseCost`/`purchaseDate`/`paymentAccountId` aren't editable after
 * creation — changing the cost after depreciation has already been posted
 * against it would silently corrupt every prior depreciation entry's math.
 * Register a correcting journal entry instead if the original cost was
 * wrong. */
export class UpdateFixedAssetDto extends PartialType(
  OmitType(CreateFixedAssetDto, [
    'purchaseCost',
    'purchaseDate',
    'paymentAccountId',
  ] as const),
) {}
