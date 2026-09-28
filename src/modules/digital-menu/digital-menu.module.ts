import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/category.entity';
import { Location } from '../locations/location.entity';
import { CompanyModule } from '../company/company.module';
import { DigitalMenuController } from './digital-menu.controller';
import { DigitalMenuService } from './digital-menu.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, Location]), CompanyModule],
  controllers: [DigitalMenuController],
  providers: [DigitalMenuService],
})
export class DigitalMenuModule {}
