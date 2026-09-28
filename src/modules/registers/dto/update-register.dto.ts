import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateRegisterDto } from './create-register.dto';

/** locationId is fixed after creation — moving a register to another
 * location isn't offered anywhere in the UI. */
export class UpdateRegisterDto extends PartialType(
  OmitType(CreateRegisterDto, ['locationId'] as const),
) {}
