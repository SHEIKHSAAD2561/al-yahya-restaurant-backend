import { OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

/** Full replacement minus `type`, which is fixed once a product is saved.
 * Variants carry their `id` to be updated in place; a variant missing from
 * the payload is deleted. */
export class UpdateProductDto extends OmitType(CreateProductDto, [
  'type',
] as const) {}
