import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tax } from './tax.entity';
import { TaxLine } from './tax-line.entity';
import { TaxesController } from './taxes.controller';
import { TaxesService } from './taxes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tax, TaxLine])],
  controllers: [TaxesController],
  providers: [TaxesService],
})
export class TaxesModule {}
