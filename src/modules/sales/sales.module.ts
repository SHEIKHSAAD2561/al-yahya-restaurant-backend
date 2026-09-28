import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { SaleLine } from './entities/sale-line.entity';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { Register } from '../registers/entities/register.entity';
import { RegisterSession } from '../registers/entities/register-session.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { VariantLocation } from '../products/entities/variant-location.entity';
import { CompositeComponent } from '../products/entities/composite-component.entity';
import { Tax } from '../taxes/tax.entity';
import { Customer } from '../customers/customer.entity';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import { ConfigurationModule } from '../configuration/configuration.module';
import { SaleSettingsModule } from '../sale-settings/sale-settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      SaleLine,
      Register,
      RegisterSession,
      ProductVariant,
      VariantLocation,
      CompositeComponent,
      Tax,
      Customer,
      PaymentMethod,
    ]),
    ConfigurationModule,
    SaleSettingsModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
