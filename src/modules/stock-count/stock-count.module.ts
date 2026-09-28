import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockCount } from './entities/stock-count.entity';
import { StockCountLine } from './entities/stock-count-line.entity';
import { StockCountController } from './stock-count.controller';
import { StockCountService } from './stock-count.service';
import { VariantLocation } from '../products/entities/variant-location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockCount, StockCountLine, VariantLocation]),
  ],
  controllers: [StockCountController],
  providers: [StockCountService],
})
export class StockCountModule {}
