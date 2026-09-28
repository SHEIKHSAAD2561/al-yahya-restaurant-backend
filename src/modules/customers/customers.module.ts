import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Sale } from '../sales/entities/sale.entity';
import { CustomerPayment } from '../customer-payments/customer-payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Sale, CustomerPayment])],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
