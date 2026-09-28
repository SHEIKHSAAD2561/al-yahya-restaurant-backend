import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Register } from './entities/register.entity';
import { RegisterSession } from './entities/register-session.entity';
import { RegisterSessionPaymentSummary } from './entities/register-session-payment-summary.entity';
import { CashMovement } from './entities/cash-movement.entity';
import { RegistersController } from './registers.controller';
import { RegistersService } from './registers.service';
import { Location } from '../locations/location.entity';
import { User } from '../users/user.entity';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import { Sale } from '../sales/entities/sale.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Register,
      RegisterSession,
      RegisterSessionPaymentSummary,
      CashMovement,
      Location,
      User,
      PaymentMethod,
      Sale,
    ]),
  ],
  controllers: [RegistersController],
  providers: [RegistersService],
})
export class RegistersModule {}
