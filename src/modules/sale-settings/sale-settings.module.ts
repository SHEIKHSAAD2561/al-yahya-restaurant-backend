import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleSettings } from './sale-settings.entity';
import { SaleSettingsController } from './sale-settings.controller';
import { SaleSettingsService } from './sale-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([SaleSettings])],
  controllers: [SaleSettingsController],
  providers: [SaleSettingsService],
  exports: [SaleSettingsService],
})
export class SaleSettingsModule {}
