import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tax } from './tax.entity';
import { TaxLine } from './tax-line.entity';
import { Configuration } from '../configuration/configuration.entity';
import { TaxesController } from './taxes.controller';
import { TaxesService } from './taxes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tax, TaxLine, Configuration])],
  controllers: [TaxesController],
  providers: [TaxesService],
})
export class TaxesModule {}
