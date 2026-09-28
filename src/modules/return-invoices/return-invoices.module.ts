import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnInvoice } from './entities/return-invoice.entity';
import { ReturnInvoiceLine } from './entities/return-invoice-line.entity';
import { ReturnInvoicesController } from './return-invoices.controller';
import { ReturnInvoicesService } from './return-invoices.service';
import { Supplier } from '../suppliers/supplier.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { VariantLocation } from '../products/entities/variant-location.entity';
import { Tax } from '../taxes/tax.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReturnInvoice,
      ReturnInvoiceLine,
      Supplier,
      ProductVariant,
      VariantLocation,
      Tax,
    ]),
  ],
  controllers: [ReturnInvoicesController],
  providers: [ReturnInvoicesService],
})
export class ReturnInvoicesModule {}
