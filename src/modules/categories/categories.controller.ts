import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateCategoryTreeDto } from './dto/create-category-tree.dto';
import { AssignProductsDto } from './dto/assign-products.dto';
import {
  RequireAnyPermission,
  RequirePermissions,
} from '../../common/decorators/require-permissions.decorator';

/**
 * Backs both the product form's inline "+ Category" (`POST /categories`) and
 * the full Settings-adjacent Category Management page (everything else) —
 * one permission (`products.manage_categories`) covers all of it, matching
 * that permission's own catalog description ("create, edit, and delete
 * product categories").
 */
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /** Read access follows products (the product form's dropdown needs it) —
   * also `pos.access`, since the Sell Screen's category rail reads this too
   * and a cashier legitimately may lack `products.access`. */
  @Get()
  @RequireAnyPermission(
    'products.access',
    'pos.access',
    'pos.manage_promotions',
  )
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('uncategorized-count')
  @RequirePermissions('products.manage_categories')
  async getUncategorizedCount() {
    return { count: await this.categoriesService.getUncategorizedCount() };
  }

  /** Individual category — optionally under an existing parent, optionally
   * assigning products to it in the same call ("Create category & assign"). */
  @Post()
  @RequirePermissions('products.manage_categories')
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  /** "Category tree" — define a whole parent → child → sub-child branch at once. */
  @Post('tree')
  @RequirePermissions('products.manage_categories')
  createTree(@Body() dto: CreateCategoryTreeDto) {
    return this.categoriesService.createTree(dto);
  }

  @Patch('unassign-products')
  @RequirePermissions('products.manage_categories')
  unassignProducts(@Body() dto: AssignProductsDto) {
    return this.categoriesService.unassignProducts(dto.productIds);
  }

  @Patch(':id/assign-products')
  @RequirePermissions('products.manage_categories')
  assignProducts(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignProductsDto,
  ) {
    return this.categoriesService.assignProducts(id, dto.productIds);
  }
}
