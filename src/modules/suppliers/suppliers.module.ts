import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from './supplier.entity';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { PurchaseInvoice } from '../purchase-invoices/entities/purchase-invoice.entity';
import { ReturnInvoice } from '../return-invoices/entities/return-invoice.entity';
import { SupplierPayment } from '../supplier-payments/supplier-payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Supplier,
      PurchaseInvoice,
      ReturnInvoice,
      SupplierPayment,
    ]),
  ],
  controllers: [SuppliersController],
  providers: [SuppliersService],
})
export class SuppliersModule {}
