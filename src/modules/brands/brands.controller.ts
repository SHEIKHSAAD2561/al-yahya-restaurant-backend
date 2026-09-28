import { Body, Controller, Get, Post } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import {
  RequireAnyPermission,
  RequirePermissions,
} from '../../common/decorators/require-permissions.decorator';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  /** Read access follows products — the product form's dropdown needs it. */
  @Get()
  @RequirePermissions('products.access')
  findAll() {
    return this.brandsService.findAll();
  }

  /** No brand-specific permission code exists — anyone creating or editing a product can add one inline (the "+"). */
  @Post()
  @RequireAnyPermission('products.create', 'products.edit')
  create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }
}
