import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Configuration } from './configuration.entity';
import { ConfigurationController } from './configuration.controller';
import { ConfigurationService } from './configuration.service';
import { Tax } from '../taxes/tax.entity';
import { Location } from '../locations/location.entity';
import { LocationsModule } from '../locations/locations.module';
import { PaymentMethod } from '../payment-methods/payment-method.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Configuration, Tax, Location, PaymentMethod]),
    LocationsModule,
  ],
  controllers: [ConfigurationController],
  providers: [ConfigurationService],
  // Products reads tax/shipping defaults for its form (GET /products/form-options).
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
