import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateReturnInvoiceDto } from './create-return-invoice.dto';

export class UpdateReturnInvoiceDto extends PartialType(
  OmitType(CreateReturnInvoiceDto, ['status'] as const),
) {}
