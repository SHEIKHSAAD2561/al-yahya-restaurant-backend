import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { VariantLocation } from './entities/variant-location.entity';
import { ProductOption } from './entities/product-option.entity';
import { ProductImage } from './entities/product-image.entity';
import { CompositeComponent } from './entities/composite-component.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Location } from '../locations/location.entity';
import { Tax } from '../taxes/tax.entity';
import { User } from '../users/user.entity';
import { ConfigurationModule } from '../configuration/configuration.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductVariant,
      VariantLocation,
      ProductOption,
      ProductImage,
      CompositeComponent,
      Location,
      Tax,
      User,
    ]),
    ConfigurationModule,
    StorageModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
