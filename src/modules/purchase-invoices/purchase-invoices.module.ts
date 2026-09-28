import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseInvoice } from './entities/purchase-invoice.entity';
import { PurchaseInvoiceLine } from './entities/purchase-invoice-line.entity';
import { PurchaseInvoicesController } from './purchase-invoices.controller';
import { PurchaseInvoicesService } from './purchase-invoices.service';
import { Supplier } from '../suppliers/supplier.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { VariantLocation } from '../products/entities/variant-location.entity';
import { Tax } from '../taxes/tax.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseInvoice,
      PurchaseInvoiceLine,
      Supplier,
      ProductVariant,
      VariantLocation,
      Tax,
    ]),
  ],
  controllers: [PurchaseInvoicesController],
  providers: [PurchaseInvoicesService],
})
export class PurchaseInvoicesModule {}
