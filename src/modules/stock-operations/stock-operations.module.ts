import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { StockMovementLine } from './entities/stock-movement-line.entity';
import { StockOperationsController } from './stock-operations.controller';
import { StockOperationsService } from './stock-operations.service';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { VariantLocation } from '../products/entities/variant-location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockMovement,
      StockMovementLine,
      ProductVariant,
      VariantLocation,
    ]),
  ],
  controllers: [StockOperationsController],
  providers: [StockOperationsService],
})
export class StockOperationsModule {}
