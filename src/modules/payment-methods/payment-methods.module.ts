import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMethod } from './payment-method.entity';
import { BankAccount } from './bank-account.entity';
import { PaymentMethodsController } from './payment-methods.controller';
import { BankAccountsController } from './bank-accounts.controller';
import { PaymentMethodsService } from './payment-methods.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentMethod, BankAccount])],
  controllers: [PaymentMethodsController, BankAccountsController],
  providers: [PaymentMethodsService],
})
export class PaymentMethodsModule {}
