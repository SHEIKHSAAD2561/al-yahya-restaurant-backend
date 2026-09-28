import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { SaleLine } from '../sales/entities/sale-line.entity';
import { VariantLocation } from '../products/entities/variant-location.entity';
import { Register } from '../registers/entities/register.entity';
import { RegisterSession } from '../registers/entities/register-session.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      SaleLine,
      VariantLocation,
      Register,
      RegisterSession,
    ]),
    ExpensesModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
