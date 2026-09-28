import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockTransfer } from './entities/stock-transfer.entity';
import { StockTransferLine } from './entities/stock-transfer-line.entity';
import { StockTransferController } from './stock-transfer.controller';
import { StockTransferService } from './stock-transfer.service';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { VariantLocation } from '../products/entities/variant-location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockTransfer,
      StockTransferLine,
      ProductVariant,
      VariantLocation,
    ]),
  ],
  controllers: [StockTransferController],
  providers: [StockTransferService],
})
export class StockTransferModule {}
