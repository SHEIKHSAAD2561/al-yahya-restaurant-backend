import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiptSettings } from './receipt-settings.entity';
import { ReceiptSettingsController } from './receipt-settings.controller';
import { ReceiptSettingsService } from './receipt-settings.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([ReceiptSettings]), StorageModule],
  controllers: [ReceiptSettingsController],
  providers: [ReceiptSettingsService],
  exports: [ReceiptSettingsService],
})
export class ReceiptSettingsModule {}
