import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { BulkUpdatePricingDto } from './dto/bulk-update-pricing.dto';
import {
  RequireAnyPermission,
  RequirePermissions,
} from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/authenticated-request';

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_IMPORT_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Route guards cover *which actions* a user may take; *what they see* inside
 * a product (cost, buy price, quantities) is trimmed per user by the service
 * via `ProductViewer` — see product-viewer.ts.
 *
 * Static-path routes (form-options, generate-sku, export, import, images,
 * bulk-pricing) must stay declared before their `:id` counterparts, or Nest
 * would match e.g. `GET /products/export` as `GET /products/:id`.
 */
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /** `pos.access` too — the Sell Screen's product grid browses this same
   * list, and a cashier role legitimately may have `pos.access` without
   * `products.access` (they're independent modules by design). */
  @Get()
  @RequireAnyPermission(
    'products.access',
    'pos.access',
    'pos.manage_promotions',
  )
  async findAll(
    @Query() query: QueryProductsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.productsService.findAll(
      query,
      await this.productsService.buildViewer(user),
    );
  }

  /** Also `pos.access` — the Sell Screen reads `sellTaxStatus` from here for
   * its "(Tax Inclusive/Exclusive)" label. */
  @Get('form-options')
  @RequireAnyPermission('products.access', 'pos.access')
  getFormOptions() {
    return this.productsService.getFormOptions();
  }

  @Get('generate-sku')
  @RequireAnyPermission('products.create', 'products.edit')
  generateSku() {
    return this.productsService.generateSku();
  }

  @Get('export')
  @RequirePermissions('products.export')
  async exportCsv(
    @Query() query: QueryProductsDto,
    @CurrentUser() user: RequestUser,
    @Res() res: Response,
  ) {
    const csv = await this.productsService.exportCsv(
      query,
      await this.productsService.buildViewer(user),
    );
    res
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="products.csv"')
      .send(csv);
  }

  @Post('import')
  @RequirePermissions('products.create')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMPORT_FILE_SIZE_BYTES },
    }),
  )
  async importCsv(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^(text\/csv|text\/plain|application\/vnd\.ms-excel)$/,
        })
        .addMaxSizeValidator({ maxSize: MAX_IMPORT_FILE_SIZE_BYTES })
        .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: RequestUser,
  ) {
    const viewer = await this.productsService.buildViewer(user);
    return this.productsService.importCsv(
      file.buffer.toString('utf-8'),
      viewer,
    );
  }

  @Post('images')
  @RequireAnyPermission('products.create', 'products.edit')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
    }),
  )
  uploadImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(png|jpe?g|webp)$/ })
        .addMaxSizeValidator({ maxSize: MAX_IMAGE_SIZE_BYTES })
        .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    file: Express.Multer.File,
  ) {
    return this.productsService.uploadImage(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
  }

  @Patch('bulk-pricing')
  @RequirePermissions('products.edit')
  async bulkUpdatePricing(
    @Body() dto: BulkUpdatePricingDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.productsService.bulkUpdatePricing(
      dto,
      await this.productsService.buildViewer(user),
    );
  }

  @Get(':id')
  @RequirePermissions('products.access')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.productsService.findOne(
      id,
      await this.productsService.buildViewer(user),
    );
  }

  @Post()
  @RequirePermissions('products.create')
  async create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.productsService.create(
      dto,
      await this.productsService.buildViewer(user),
    );
  }

  @Patch(':id')
  @RequirePermissions('products.edit')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.productsService.update(
      id,
      dto,
      await this.productsService.buildViewer(user),
    );
  }

  @Delete(':id')
  @RequirePermissions('products.delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
