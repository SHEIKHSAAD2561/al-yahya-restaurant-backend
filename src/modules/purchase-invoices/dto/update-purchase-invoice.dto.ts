import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePurchaseInvoiceDto } from './create-purchase-invoice.dto';

/** Only reachable while the invoice is still `DRAFT` — `status` isn't
 * editable here, use `POST /purchase-invoices/:id/confirm` to confirm. */
export class UpdatePurchaseInvoiceDto extends PartialType(
  OmitType(CreatePurchaseInvoiceDto, ['status'] as const),
) {}
