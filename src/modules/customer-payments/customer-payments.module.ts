import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerPayment } from './customer-payment.entity';
import { CustomerPaymentsController } from './customer-payments.controller';
import { CustomerPaymentsService } from './customer-payments.service';
import { Customer } from '../customers/customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerPayment, Customer])],
  controllers: [CustomerPaymentsController],
  providers: [CustomerPaymentsService],
})
export class CustomerPaymentsModule {}
