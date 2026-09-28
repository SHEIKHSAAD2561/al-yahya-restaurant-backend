import { randomInt, randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  DataSource,
  EntityManager,
  In,
  Not,
  Repository,
} from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { VariantLocation } from './entities/variant-location.entity';
import { ProductOption } from './entities/product-option.entity';
import { ProductImage } from './entities/product-image.entity';
import { CompositeComponent } from './entities/composite-component.entity';
import { ProductType } from './product-type.enum';
import { canSeeStockAt, type ProductViewer } from './product-viewer';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductVariantDto } from './dto/product-variant.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { BulkUpdatePricingDto } from './dto/bulk-update-pricing.dto';
import { Category } from '../categories/category.entity';
import { Brand } from '../brands/brand.entity';
import { Location } from '../locations/location.entity';
import { Tax } from '../taxes/tax.entity';
import { User } from '../users/user.entity';
import { ConfigurationService } from '../configuration/configuration.service';
import { FirebaseStorageService } from '../storage/firebase-storage.service';
import { toCsv, parseCsv } from '../../common/utils/csv.util';
import type { RequestUser } from '../../common/types/authenticated-request';

const DEFAULT_PAGE_SIZE = 10;
const MAX_EXPORT_ROWS = 5000;
const MAX_IMPORT_ROWS = 1000;

export interface ImportRowResult {
  row: number;
  sku: string;
  status: 'created' | 'error';
  message?: string;
}

export interface ProductListItem {
  variantId: string;
  productId: string;
  productType: ProductType;
  /** Variant display name, e.g. "T-Shirt - Red / L". */
  name: string;
  mainProductName: string;
  imageUrl: string | null;
  categoryName: string | null;
  sku: string;
  barcode: string | null;
  /** Summed over the locations the viewer may see; omitted without stock access
   * or when the product doesn't track quantity. */
  quantity?: number;
  cost?: number;
  /** From the default location's row (falls back to the first row). */
  retailPrice: number | null;
  wholesalePrice: number | null;
  taxName: string | null;
}

/** Product type-specific rules — the DTO alone can't express these. */
@Injectable()
export class ProductsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(VariantLocation)
    private readonly variantLocationRepository: Repository<VariantLocation>,
    @InjectRepository(CompositeComponent)
    private readonly componentRepository: Repository<CompositeComponent>,
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(Tax)
    private readonly taxRepository: Repository<Tax>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configurationService: ConfigurationService,
    private readonly storageService: FirebaseStorageService,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  // ---------------------------------------------------------------- viewer

  async buildViewer(user: RequestUser): Promise<ProductViewer> {
    const canViewCost = user.permissionCodes.has('products.view_cost');
    if (!user.permissionCodes.has('stock.access')) {
      return { canViewCost, stockLocationIds: null };
    }
    const record = await this.userRepository.findOne({
      where: { id: user.id },
      relations: { locations: true },
    });
    if (!record || record.allLocations) {
      return { canViewCost, stockLocationIds: 'all' };
    }
    return {
      canViewCost,
      stockLocationIds: new Set(
        record.locations.map((location) => location.id),
      ),
    };
  }

  // ------------------------------------------------------------- form data

  /** Everything the product form needs beyond the product itself, as a
   * narrow projection — so a products user doesn't also need
   * `settings.financial_settings` just to fill in a tax dropdown. */
  async getFormOptions() {
    const [configuration, locations, taxes] = await Promise.all([
      this.configurationService.get(),
      this.locationRepository.find({
        select: { id: true, name: true, isDefault: true },
        where: { isActive: true },
        order: { isDefault: 'DESC', name: 'ASC' },
      }),
      this.taxRepository.find({
        select: { id: true, name: true },
        where: { isActive: true },
        order: { createdAt: 'ASC' },
      }),
    ]);
    return {
      locations,
      taxes,
      defaultTaxId: configuration.defaultTaxId,
      sellTaxStatus: configuration.sellTaxStatus,
      costTaxStatus: configuration.costTaxStatus,
      shippingWeightUnit: configuration.shippingWeightUnit,
      shippingDimensionUnit: configuration.shippingDimensionUnit,
    };
  }

  /** 12-digit numeric SKU not used as any SKU or barcode yet. */
  async generateSku(): Promise<{ sku: string }> {
    for (;;) {
      const sku = String(randomInt(100_000_000_000, 1_000_000_000_000));
      const taken = await this.variantRepository.exists({
        where: [{ sku }, { barcode: sku }],
      });
      if (!taken) return { sku };
    }
  }

  async uploadImage(buffer: Buffer, originalName: string, contentType: string) {
    const ext = originalName.includes('.')
      ? originalName.split('.').pop()
      : 'png';
    const url = await this.storageService.uploadFile(
      buffer,
      `products/${randomUUID()}.${ext}`,
      contentType,
    );
    return { url };
  }

  // ------------------------------------------------------------------ list

  async findAll(query: QueryProductsDto, viewer: ProductViewer) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

    const [variants, total] = await this.buildListQuery(query)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const items = await this.toListItems(variants, viewer);
    return { items, total, page, pageSize };
  }

  /** Shared by `findAll` (paginated) and `exportCsv` (capped, unpaginated) —
   * same filters and sort, just a different slice. */
  private buildListQuery(query: QueryProductsDto) {
    const qb = this.variantRepository
      .createQueryBuilder('variant')
      .innerJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('product.category', 'category');

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        new Brackets((where) => {
          where
            .where('product.name LIKE :search', { search })
            .orWhere('variant.sku LIKE :search', { search })
            .orWhere('variant.barcode LIKE :search', { search });
        }),
      );
    }
    if (query.type) qb.andWhere('product.type = :type', { type: query.type });
    if (query.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    } else if (query.uncategorized) {
      qb.andWhere('product.categoryId IS NULL');
    }
    if (query.excludeComposite) {
      qb.andWhere('product.type != :composite', {
        composite: ProductType.COMPOSITE,
      });
    }

    switch (query.sort ?? 'CREATED_DESC') {
      case 'CREATED_ASC':
        qb.orderBy('product.createdAt', 'ASC');
        break;
      case 'NAME_ASC':
        qb.orderBy('product.name', 'ASC');
        break;
      case 'NAME_DESC':
        qb.orderBy('product.name', 'DESC');
        break;
      default:
        qb.orderBy('product.createdAt', 'DESC');
    }
    return qb.addOrderBy('product.id').addOrderBy('variant.sortOrder', 'ASC');
  }

  /** CSV of the (filtered) list — same columns the list page shows, so it
   * respects the same per-user trimming (`viewer`) as everywhere else. Capped
   * at MAX_EXPORT_ROWS rather than paginated: an export is meant to be "give
   * me everything that matches", not one page at a time. */
  async exportCsv(
    query: QueryProductsDto,
    viewer: ProductViewer,
  ): Promise<string> {
    const variants = await this.buildListQuery(query)
      .take(MAX_EXPORT_ROWS)
      .getMany();
    const items = await this.toListItems(variants, viewer);

    const header = [
      'Product Name',
      'Main Product',
      'Category',
      'SKU',
      'Barcode',
      ...(viewer.stockLocationIds !== null ? ['Available Quantity'] : []),
      ...(viewer.canViewCost ? ['Cost'] : []),
      'Retail Price',
      'Wholesale Price',
      'Tax',
    ];
    const rows = items.map((item) => [
      item.name,
      item.mainProductName,
      item.categoryName ?? '',
      item.sku,
      item.barcode ?? '',
      ...(viewer.stockLocationIds !== null ? [item.quantity ?? ''] : []),
      ...(viewer.canViewCost ? [item.cost ?? ''] : []),
      item.retailPrice ?? '',
      item.wholesalePrice ?? '',
      item.taxName ?? '',
    ]);
    // A leading BOM so Excel opens the UTF-8 file (Arabic names, etc.) correctly.
    return '﻿' + toCsv([header, ...rows]);
  }

  private async toListItems(
    variants: ProductVariant[],
    viewer: ProductViewer,
  ): Promise<ProductListItem[]> {
    if (variants.length === 0) return [];

    const productIds = [
      ...new Set(variants.map((variant) => variant.productId)),
    ];
    const [rows, images, defaultLocation] = await Promise.all([
      this.variantLocationRepository.find({
        where: { variantId: In(variants.map((variant) => variant.id)) },
      }),
      this.imageRepository.find({
        where: { productId: In(productIds) },
        order: { sortOrder: 'ASC' },
      }),
      this.locationRepository.findOne({ where: { isDefault: true } }),
    ]);
    const taxNames = await this.taxNames(rows.map((row) => row.taxId));
    const composites = await this.loadCompositeData(
      variants
        .filter((variant) => variant.product.type === ProductType.COMPOSITE)
        .map((variant) => variant.product),
    );

    return variants.map((variant) => {
      const product = variant.product;
      const variantRows = rows.filter((row) => row.variantId === variant.id);
      const priceRow =
        variantRows.find((row) => row.locationId === defaultLocation?.id) ??
        variantRows[0] ??
        null;
      const composite = composites.get(product.id);

      const item: ProductListItem = {
        variantId: variant.id,
        productId: product.id,
        productType: product.type,
        name: this.variantName(product, variant),
        mainProductName: product.name,
        imageUrl:
          images.find((image) => image.productId === product.id)?.url ?? null,
        categoryName: product.category?.name ?? null,
        sku: variant.sku,
        barcode: variant.barcode,
        retailPrice: priceRow?.retailPrice ?? null,
        wholesalePrice: priceRow?.wholesalePrice ?? null,
        taxName: priceRow?.taxId
          ? (taxNames.get(priceRow.taxId) ?? null)
          : null,
      };
      if (viewer.canViewCost) {
        item.cost = composite ? composite.cost : variant.cost;
      }
      if (
        viewer.stockLocationIds !== null &&
        (composite ? composite.tracksQuantity : product.trackQuantity)
      ) {
        const visible = (locationId: string) =>
          canSeeStockAt(viewer, locationId);
        item.quantity = composite
          ? [...composite.maxToSell.entries()]
              .filter(([locationId]) => visible(locationId))
              .reduce((sum, [, quantity]) => sum + quantity, 0)
          : variantRows
              .filter((row) => visible(row.locationId))
              .reduce((sum, row) => sum + row.quantity, 0);
      }
      return item;
    });
  }

  // ---------------------------------------------------------------- detail

  async findOne(id: string, viewer: ProductViewer) {
    const product = await this.loadProduct(id);
    const composite = (await this.loadCompositeData([product])).get(product.id);
    const componentVariants =
      composite?.componentVariants ?? new Map<string, ProductVariant>();

    return {
      id: product.id,
      type: product.type,
      name: product.name,
      description: product.description,
      isSellable: product.isSellable,
      isPurchasable: product.isPurchasable,
      trackQuantity: product.trackQuantity,
      isWeighted: product.isWeighted,
      reorderPoint: product.reorderPoint,
      categoryId: product.categoryId,
      brandId: product.brandId,
      shippingWeight: product.shippingWeight,
      shippingLength: product.shippingLength,
      shippingWidth: product.shippingWidth,
      shippingHeight: product.shippingHeight,
      imageUrls: product.images.map((image) => image.url),
      options: product.options.map((option) => ({
        name: option.name,
        values: option.values,
      })),
      components: product.components.map((component) => {
        const componentVariant = componentVariants.get(
          component.componentVariantId,
        );
        return {
          variantId: component.componentVariantId,
          quantity: component.quantity,
          name: componentVariant
            ? this.variantName(componentVariant.product, componentVariant)
            : '',
          sku: componentVariant?.sku ?? '',
          ...(viewer.canViewCost ? { cost: componentVariant?.cost ?? 0 } : {}),
        };
      }),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        name: this.variantName(product, variant),
        optionValues: variant.optionValues,
        sku: variant.sku,
        barcode: variant.barcode,
        ...(viewer.canViewCost
          ? { cost: composite ? composite.cost : variant.cost }
          : {}),
        locations: variant.locations.map((row) => ({
          locationId: row.locationId,
          retailPrice: row.retailPrice,
          wholesalePrice: row.wholesalePrice,
          taxId: row.taxId,
          ...(viewer.canViewCost ? { buyPrice: row.buyPrice } : {}),
          ...(canSeeStockAt(viewer, row.locationId) &&
          (!composite || composite.tracksQuantity)
            ? {
                quantity: composite
                  ? (composite.maxToSell.get(row.locationId) ?? 0)
                  : row.quantity,
              }
            : {}),
        })),
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  // ---------------------------------------------------------------- create

  async create(dto: CreateProductDto, viewer: ProductViewer) {
    await this.validate(dto.type, dto);

    const isComposite = dto.type === ProductType.COMPOSITE;
    const product = this.productRepository.create({
      type: dto.type,
      ...this.scalarFields(dto, dto.type),
      options: this.buildOptions(dto),
      images: (dto.imageUrls ?? []).map((url, index) =>
        this.imageRepository.create({ url, sortOrder: index }),
      ),
      components: isComposite
        ? (dto.components ?? []).map((component) =>
            this.componentRepository.create({
              componentVariantId: component.variantId,
              quantity: component.quantity,
            }),
          )
        : [],
      variants: dto.variants.map((variantDto, index) =>
        this.buildNewVariant(variantDto, index, dto.type, viewer),
      ),
    });
    const saved = await this.productRepository.save(product);
    return this.findOne(saved.id, viewer);
  }

  // ---------------------------------------------------------------- update

  async update(id: string, dto: UpdateProductDto, viewer: ProductViewer) {
    const product = await this.loadProduct(id);
    await this.validate(product.type, dto, product.id);

    const existingById = new Map(
      product.variants.map((variant) => [variant.id, variant]),
    );
    for (const variantDto of dto.variants) {
      if (variantDto.id && !existingById.has(variantDto.id)) {
        throw new BadRequestException(this.t('products.variant_not_found'));
      }
    }
    const keptIds = new Set(
      dto.variants.map((variant) => variant.id).filter(Boolean),
    );
    const removedIds = product.variants
      .filter((variant) => !keptIds.has(variant.id))
      .map((variant) => variant.id);
    if (removedIds.length > 0) {
      await this.assertVariantsNotInComposites(removedIds);
    }

    const previousImageUrls = product.images.map((image) => image.url);

    await this.dataSource.transaction(async (manager) => {
      await manager.update(Product, product.id, {
        ...this.scalarFields(dto, product.type),
        updatedAt: new Date(),
      });

      // Options, images and components are small — full replace.
      await manager.delete(ProductOption, { productId: product.id });
      await manager.delete(ProductImage, { productId: product.id });
      await manager.delete(CompositeComponent, { productId: product.id });
      await manager.save(
        this.buildOptions(dto).map((option) =>
          Object.assign(option, { productId: product.id }),
        ),
      );
      await manager.save(
        (dto.imageUrls ?? []).map((url, index) =>
          manager.create(ProductImage, {
            productId: product.id,
            url,
            sortOrder: index,
          }),
        ),
      );
      if (product.type === ProductType.COMPOSITE) {
        await manager.save(
          (dto.components ?? []).map((component) =>
            manager.create(CompositeComponent, {
              productId: product.id,
              componentVariantId: component.variantId,
              quantity: component.quantity,
            }),
          ),
        );
      }

      if (removedIds.length > 0) {
        await manager.delete(ProductVariant, { id: In(removedIds) });
      }
      // Two passes so swapping SKUs between variants doesn't trip the unique
      // index mid-save: park every kept variant on a temporary SKU first.
      for (const variantDto of dto.variants) {
        if (variantDto.id) {
          await manager.update(ProductVariant, variantDto.id, {
            sku: `tmp-${randomUUID()}`,
            barcode: null,
          });
        }
      }
      for (const [index, variantDto] of dto.variants.entries()) {
        const existing = variantDto.id
          ? existingById.get(variantDto.id)
          : undefined;
        if (existing) {
          await this.updateExistingVariant(
            manager,
            existing,
            variantDto,
            index,
            viewer,
          );
        } else {
          const created = this.buildNewVariant(
            variantDto,
            index,
            product.type,
            viewer,
          );
          await manager.save(Object.assign(created, { productId: product.id }));
        }
      }
    });

    await this.deleteImages(
      previousImageUrls.filter((url) => !(dto.imageUrls ?? []).includes(url)),
    );
    return this.findOne(product.id, viewer);
  }

  // ---------------------------------------------------------------- delete

  async remove(id: string): Promise<void> {
    const product = await this.loadProduct(id);
    await this.assertVariantsNotInComposites(
      product.variants.map((variant) => variant.id),
    );
    await this.productRepository.delete(product.id);
    await this.deleteImages(product.images.map((image) => image.url));
  }

  // ---------------------------------------------------------- bulk pricing

  /**
   * "Bulk Edit Products Info": edits prices/tax/re-order point for many
   * variants at one location in a single call, without resending each
   * product's whole payload the way the product form's PATCH does. Only the
   * fields present on a given row are touched — omit a field to leave it
   * alone (this is how the UI's "Select fields to edit" toggles work).
   */
  async bulkUpdatePricing(
    dto: BulkUpdatePricingDto,
    viewer: ProductViewer,
  ): Promise<{ updated: number }> {
    if (
      !(await this.locationRepository.exists({ where: { id: dto.locationId } }))
    ) {
      throw new BadRequestException(this.t('products.location_not_found'));
    }

    const variantIds = [...new Set(dto.items.map((item) => item.variantId))];
    const variants = await this.variantRepository.find({
      where: { id: In(variantIds) },
      relations: { product: true, locations: true },
    });
    const variantsById = new Map(
      variants.map((variant) => [variant.id, variant]),
    );
    if (variantsById.size !== variantIds.length) {
      throw new BadRequestException(this.t('products.variant_not_found'));
    }

    const taxIds = [
      ...new Set(
        dto.items
          .map((item) => item.taxId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (
      taxIds.length > 0 &&
      (await this.taxRepository.countBy({ id: In(taxIds) })) !== taxIds.length
    ) {
      throw new BadRequestException(this.t('products.tax_not_found'));
    }

    await this.dataSource.transaction(async (manager) => {
      for (const item of dto.items) {
        const variant = variantsById.get(item.variantId)!;
        const isComposite = variant.product.type === ProductType.COMPOSITE;

        const patch: Partial<VariantLocation> = {};
        if (item.retailPrice !== undefined)
          patch.retailPrice = item.retailPrice;
        if (item.wholesalePrice !== undefined)
          patch.wholesalePrice = item.wholesalePrice;
        if (item.taxId !== undefined) patch.taxId = item.taxId;
        // Same rule as the product form: buy price is cost-gated, and a
        // composite's cost/buy price is always derived, never stored here.
        if (item.buyPrice !== undefined && viewer.canViewCost && !isComposite) {
          patch.buyPrice = item.buyPrice;
        }
        if (Object.keys(patch).length > 0) {
          const existingRow = variant.locations.find(
            (row) => row.locationId === dto.locationId,
          );
          if (existingRow) {
            await manager.update(VariantLocation, existingRow.id, patch);
          } else {
            await manager.save(
              manager.create(VariantLocation, {
                variantId: variant.id,
                locationId: dto.locationId,
                quantity: 0,
                ...patch,
              }),
            );
          }
        }

        // Re-order point lives on the product, not the row, and doesn't
        // apply to a composite (see Product.reorderPoint).
        if (item.reorderPoint !== undefined && !isComposite) {
          await manager.update(Product, variant.productId, {
            reorderPoint: item.reorderPoint,
          });
        }
      }
    });

    return { updated: dto.items.length };
  }

  // --------------------------------------------------------------- import

  /**
   * CSV import of SIMPLE products only (matches this app's own "variants and
   * composites aren't supported yet" limitation on the import template — see
   * the Import Products dialog). Each row is built into the same shape
   * `create()` already validates and trims by permission, so a row is
   * rejected for exactly the same reasons a manual save would be (duplicate
   * SKU, etc.) — no separate validation path to keep in sync.
   */
  async importCsv(
    csvText: string,
    viewer: ProductViewer,
  ): Promise<{ imported: number; total: number; results: ImportRowResult[] }> {
    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      return { imported: 0, total: 0, results: [] };
    }

    const header = rows[0].map((cell) => cell.trim().toLowerCase());
    const columnIndex = (label: string) => header.indexOf(label);
    const columns = {
      name: columnIndex('product name'),
      sku: columnIndex('sku'),
      barcode: columnIndex('barcode'),
      description: columnIndex('description'),
      category: columnIndex('category'),
      tax: columnIndex('tax'),
      retail: columnIndex('retail price'),
      wholesale: columnIndex('wholesale price'),
      buy: columnIndex('buy price'),
      quantity: columnIndex('initial quantity'),
      reorder: columnIndex('reorder point'),
      sellable: columnIndex('sellable'),
      purchasable: columnIndex('purchasable'),
      weighted: columnIndex('weighted'),
    };
    if (columns.name === -1 || columns.sku === -1) {
      throw new BadRequestException(this.t('products.import_missing_columns'));
    }

    const dataRows = rows
      .slice(1)
      .filter((row) => row.some((cellValue) => cellValue.trim() !== ''));
    if (dataRows.length > MAX_IMPORT_ROWS) {
      throw new BadRequestException(
        `${this.t('products.import_too_many_rows')} (${MAX_IMPORT_ROWS})`,
      );
    }

    const [categories, taxes, defaultLocation] = await Promise.all([
      this.dataSource.manager.find(Category),
      this.taxRepository.find({ where: { isActive: true } }),
      this.locationRepository.findOne({ where: { isDefault: true } }),
    ]);
    const categoryByName = new Map(
      categories.map((category) => [category.name.toLowerCase(), category]),
    );
    const taxByName = new Map(
      taxes.map((tax) => [tax.name.toLowerCase(), tax]),
    );

    const cellAt = (row: string[], index: number) =>
      index >= 0 ? (row[index] ?? '').trim() : '';
    const toBoolean = (value: string, fallback: boolean) =>
      value === ''
        ? fallback
        : ['1', 'true', 'yes', 'y'].includes(value.toLowerCase());
    const toNumberOrUndefined = (value: string) =>
      value === '' ? undefined : Number(value);

    const results: ImportRowResult[] = [];
    let imported = 0;

    for (const [rowIndex, row] of dataRows.entries()) {
      const rowNumber = rowIndex + 2; // +1 for 0-index, +1 for the header row.
      const name = cellAt(row, columns.name);
      const sku = cellAt(row, columns.sku);
      if (!name || !sku) {
        results.push({
          row: rowNumber,
          sku,
          status: 'error',
          message: this.t('products.import_missing_required'),
        });
        continue;
      }

      const categoryName = cellAt(row, columns.category);
      const category = categoryName
        ? categoryByName.get(categoryName.toLowerCase())
        : undefined;
      const taxName = cellAt(row, columns.tax);
      const tax = taxName ? taxByName.get(taxName.toLowerCase()) : undefined;

      const locations = defaultLocation
        ? [
            {
              locationId: defaultLocation.id,
              quantity: toNumberOrUndefined(cellAt(row, columns.quantity)),
              retailPrice:
                toNumberOrUndefined(cellAt(row, columns.retail)) ?? null,
              wholesalePrice:
                toNumberOrUndefined(cellAt(row, columns.wholesale)) ?? null,
              buyPrice: toNumberOrUndefined(cellAt(row, columns.buy)) ?? null,
              taxId: tax?.id ?? null,
            },
          ]
        : [];

      try {
        // Not run through class-validator (this isn't an HTTP body) — `create()`'s
        // own reference/identifier checks below are what actually guard it.
        await this.create(
          {
            type: ProductType.SIMPLE,
            name,
            description: cellAt(row, columns.description) || undefined,
            isSellable: toBoolean(cellAt(row, columns.sellable), true),
            isPurchasable: toBoolean(cellAt(row, columns.purchasable), true),
            isWeighted: toBoolean(cellAt(row, columns.weighted), false),
            reorderPoint: toNumberOrUndefined(cellAt(row, columns.reorder)),
            categoryId: category?.id,
            variants: [
              {
                sku,
                barcode: cellAt(row, columns.barcode) || undefined,
                cost: 0,
                locations,
              },
            ],
          },
          viewer,
        );
        imported++;
        const warnings = [
          categoryName && !category
            ? this.t('products.import_category_not_found')
            : null,
          taxName && !tax ? this.t('products.import_tax_not_found') : null,
        ].filter((message): message is string => Boolean(message));
        results.push({
          row: rowNumber,
          sku,
          status: 'created',
          ...(warnings.length > 0 ? { message: warnings.join(' ') } : {}),
        });
      } catch (error) {
        results.push({
          row: rowNumber,
          sku,
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { imported, total: dataRows.length, results };
  }

  // --------------------------------------------------------------- helpers

  private async loadProduct(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: {
        variants: { locations: true },
        options: true,
        images: true,
        components: true,
      },
      order: {
        variants: { sortOrder: 'ASC' },
        options: { sortOrder: 'ASC' },
        images: { sortOrder: 'ASC' },
      },
    });
    if (!product) {
      throw new NotFoundException(this.t('products.not_found'));
    }
    return product;
  }

  private variantName(product: Product, variant: ProductVariant): string {
    return product.type === ProductType.VARIABLE && variant.optionValues?.length
      ? `${product.name} - ${variant.optionValues.join(' / ')}`
      : product.name;
  }

  private scalarFields(dto: UpdateProductDto, type: ProductType) {
    const isComposite = type === ProductType.COMPOSITE;
    return {
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      isSellable: dto.isSellable ?? true,
      // A composite is assembled from components — never bought, never
      // stocked on its own.
      isPurchasable: isComposite ? false : (dto.isPurchasable ?? true),
      trackQuantity: isComposite ? false : (dto.trackQuantity ?? true),
      isWeighted: isComposite ? false : (dto.isWeighted ?? false),
      reorderPoint: isComposite ? null : (dto.reorderPoint ?? null),
      categoryId: dto.categoryId ?? null,
      brandId: dto.brandId ?? null,
      shippingWeight: dto.shippingWeight ?? null,
      shippingLength: dto.shippingLength ?? null,
      shippingWidth: dto.shippingWidth ?? null,
      shippingHeight: dto.shippingHeight ?? null,
    };
  }

  private buildOptions(dto: UpdateProductDto): ProductOption[] {
    return (dto.options ?? []).map((option, index) =>
      this.dataSource.manager.create(ProductOption, {
        name: option.name.trim(),
        values: option.values.map((value) => value.trim()),
        sortOrder: index,
      }),
    );
  }

  private buildNewVariant(
    dto: ProductVariantDto,
    index: number,
    type: ProductType,
    viewer: ProductViewer,
  ): ProductVariant {
    const isComposite = type === ProductType.COMPOSITE;
    // Initial quantity is only settable by someone who can see stock, and
    // only for locations they can see; composites never hold their own stock.
    const canSetQuantity = (locationId: string) =>
      !isComposite && canSeeStockAt(viewer, locationId);

    return this.variantRepository.create({
      optionValues:
        type === ProductType.VARIABLE
          ? (dto.optionValues ?? []).map((value) => value.trim())
          : null,
      sku: dto.sku.trim(),
      barcode: dto.barcode?.trim() || null,
      cost: !isComposite && viewer.canViewCost ? (dto.cost ?? 0) : 0,
      sortOrder: index,
      locations: dto.locations.map((row) =>
        this.variantLocationRepository.create({
          locationId: row.locationId,
          quantity: canSetQuantity(row.locationId) ? (row.quantity ?? 0) : 0,
          retailPrice: row.retailPrice ?? null,
          wholesalePrice: row.wholesalePrice ?? null,
          buyPrice:
            viewer.canViewCost && !isComposite ? (row.buyPrice ?? null) : null,
          taxId: row.taxId ?? null,
        }),
      ),
    });
  }

  /** Prices/tax/identifiers only — quantity (stock operations) and cost
   * (weighted average) are never changed from the product form. */
  private async updateExistingVariant(
    manager: EntityManager,
    existing: ProductVariant,
    dto: ProductVariantDto,
    index: number,
    viewer: ProductViewer,
  ): Promise<void> {
    await manager.update(ProductVariant, existing.id, {
      optionValues:
        existing.optionValues === null
          ? null
          : (dto.optionValues ?? []).map((value) => value.trim()),
      sku: dto.sku.trim(),
      barcode: dto.barcode?.trim() || null,
      sortOrder: index,
    });

    const rowsByLocation = new Map(
      existing.locations.map((row) => [row.locationId, row]),
    );
    for (const rowDto of dto.locations) {
      const prices = {
        retailPrice: rowDto.retailPrice ?? null,
        wholesalePrice: rowDto.wholesalePrice ?? null,
        taxId: rowDto.taxId ?? null,
        ...(viewer.canViewCost ? { buyPrice: rowDto.buyPrice ?? null } : {}),
      };
      const row = rowsByLocation.get(rowDto.locationId);
      if (row) {
        await manager.update(VariantLocation, row.id, prices);
      } else {
        await manager.save(
          manager.create(VariantLocation, {
            variantId: existing.id,
            locationId: rowDto.locationId,
            quantity: 0,
            ...prices,
          }),
        );
      }
    }
  }

  private async validate(
    type: ProductType,
    dto: UpdateProductDto,
    productId?: string,
  ): Promise<void> {
    this.validateShape(type, dto);
    await this.validateReferences(dto, productId);
    await this.validateIdentifiers(dto, productId);
  }

  private validateShape(type: ProductType, dto: UpdateProductDto): void {
    const options = dto.options ?? [];
    const components = dto.components ?? [];

    if (type !== ProductType.VARIABLE) {
      if (dto.variants.length !== 1 || options.length > 0) {
        throw new BadRequestException(
          this.t('products.invalid_variants_for_type'),
        );
      }
    } else {
      if (options.length === 0) {
        throw new BadRequestException(this.t('products.options_required'));
      }
      const optionNames = options.map((option) =>
        option.name.trim().toLowerCase(),
      );
      if (new Set(optionNames).size !== optionNames.length) {
        throw new BadRequestException(this.t('products.duplicate_option'));
      }
      const combinations = new Set<string>();
      for (const variant of dto.variants) {
        const values = variant.optionValues ?? [];
        const valid =
          values.length === options.length &&
          values.every((value, index) =>
            options[index].values.map((v) => v.trim()).includes(value.trim()),
          );
        if (!valid) {
          throw new BadRequestException(
            this.t('products.invalid_option_values'),
          );
        }
        const key = values
          .map((value) => value.trim().toLowerCase())
          .join('\u0000');
        if (combinations.has(key)) {
          throw new BadRequestException(this.t('products.duplicate_variant'));
        }
        combinations.add(key);
      }
    }

    if (type === ProductType.COMPOSITE) {
      if (components.length === 0) {
        throw new BadRequestException(this.t('products.components_required'));
      }
      const ids = components.map((component) => component.variantId);
      if (new Set(ids).size !== ids.length) {
        throw new BadRequestException(this.t('products.duplicate_component'));
      }
    } else if (components.length > 0) {
      throw new BadRequestException(
        this.t('products.invalid_variants_for_type'),
      );
    }

    for (const variant of dto.variants) {
      const locationIds = variant.locations.map((row) => row.locationId);
      if (new Set(locationIds).size !== locationIds.length) {
        throw new BadRequestException(this.t('products.duplicate_location'));
      }
    }
  }

  private async validateReferences(
    dto: UpdateProductDto,
    productId?: string,
  ): Promise<void> {
    const manager = this.dataSource.manager;
    if (
      dto.categoryId &&
      !(await manager.exists(Category, { where: { id: dto.categoryId } }))
    ) {
      throw new BadRequestException(this.t('products.category_not_found'));
    }
    if (
      dto.brandId &&
      !(await manager.exists(Brand, { where: { id: dto.brandId } }))
    ) {
      throw new BadRequestException(this.t('products.brand_not_found'));
    }

    const rows = dto.variants.flatMap((variant) => variant.locations);
    const locationIds = [...new Set(rows.map((row) => row.locationId))];
    if (
      locationIds.length > 0 &&
      (await this.locationRepository.countBy({ id: In(locationIds) })) !==
        locationIds.length
    ) {
      throw new BadRequestException(this.t('products.location_not_found'));
    }
    const taxIds = [
      ...new Set(
        rows.map((row) => row.taxId).filter((id): id is string => Boolean(id)),
      ),
    ];
    if (
      taxIds.length > 0 &&
      (await this.taxRepository.countBy({ id: In(taxIds) })) !== taxIds.length
    ) {
      throw new BadRequestException(this.t('products.tax_not_found'));
    }

    const componentIds = (dto.components ?? []).map(
      (component) => component.variantId,
    );
    if (componentIds.length > 0) {
      const componentVariants = await this.variantRepository.find({
        where: { id: In(componentIds) },
        relations: { product: true },
      });
      if (componentVariants.length !== componentIds.length) {
        throw new BadRequestException(this.t('products.component_not_found'));
      }
      if (
        componentVariants.some(
          (variant) =>
            variant.product.type === ProductType.COMPOSITE ||
            variant.productId === productId,
        )
      ) {
        throw new BadRequestException(
          this.t('products.component_cannot_be_composite'),
        );
      }
    }
  }

  /** SKUs and barcodes share one namespace: unique among themselves and
   * across each other ("SKU number cannot be the same as Barcode for another
   * product"). Checked against the payload and every other product's variants. */
  private async validateIdentifiers(
    dto: UpdateProductDto,
    productId?: string,
  ): Promise<void> {
    const skus = dto.variants.map((variant) => variant.sku.trim());
    const barcodes = dto.variants
      .map((variant) => variant.barcode?.trim())
      .filter((code): code is string => Boolean(code));
    const all = [...skus, ...barcodes];
    if (new Set(all).size !== all.length) {
      throw new ConflictException(
        this.t('products.duplicate_identifier_in_request'),
      );
    }

    const others = productId ? { productId: Not(productId) } : {};
    const clash = await this.variantRepository.findOne({
      where: [
        { sku: In(all), ...others },
        { barcode: In(all), ...others },
      ],
    });
    if (clash) {
      const code = all.includes(clash.sku) ? clash.sku : clash.barcode;
      throw new ConflictException(
        `${this.t('products.identifier_taken')} (${code})`,
      );
    }
  }

  private async assertVariantsNotInComposites(
    variantIds: string[],
  ): Promise<void> {
    if (
      await this.componentRepository.exists({
        where: { componentVariantId: In(variantIds) },
      })
    ) {
      throw new BadRequestException(
        this.t('products.variant_in_use_by_composite'),
      );
    }
  }

  private async taxNames(
    taxIds: (string | null)[],
  ): Promise<Map<string, string>> {
    const ids = [...new Set(taxIds.filter((id): id is string => Boolean(id)))];
    if (ids.length === 0) return new Map();
    const taxes = await this.taxRepository.find({
      select: { id: true, name: true },
      where: { id: In(ids) },
    });
    return new Map(taxes.map((tax) => [tax.id, tax.name]));
  }

  /**
   * A composite's cost and sellable quantity aren't stored — they're derived
   * from its components: cost = Σ(component cost × qty); per location, max to
   * sell = min over components of ⌊component stock ÷ qty⌋ (components that
   * don't track quantity don't limit it).
   */
  private async loadCompositeData(products: Product[]) {
    const result = new Map<
      string,
      {
        cost: number;
        /** False when no component tracks stock — then there's no limit to show. */
        tracksQuantity: boolean;
        maxToSell: Map<string, number>;
        componentVariants: Map<string, ProductVariant>;
      }
    >();
    const composites = products.filter(
      (product) => product.type === ProductType.COMPOSITE,
    );
    if (composites.length === 0) return result;

    const components = await this.componentRepository.find({
      where: { productId: In(composites.map((product) => product.id)) },
    });
    const variantIds = [
      ...new Set(components.map((component) => component.componentVariantId)),
    ];
    const componentVariants = variantIds.length
      ? await this.variantRepository.find({
          where: { id: In(variantIds) },
          relations: { product: true, locations: true },
        })
      : [];
    const variantsById = new Map(
      componentVariants.map((variant) => [variant.id, variant]),
    );
    const locations = await this.locationRepository.find({
      select: { id: true },
    });

    for (const product of composites) {
      const lines = components.filter(
        (component) => component.productId === product.id,
      );
      let cost = 0;
      const maxToSell = new Map<string, number>();
      for (const location of locations) {
        let max = Infinity;
        for (const line of lines) {
          const variant = variantsById.get(line.componentVariantId);
          if (!variant?.product.trackQuantity) continue;
          const stock =
            variant.locations.find((row) => row.locationId === location.id)
              ?.quantity ?? 0;
          max = Math.min(max, Math.floor(stock / line.quantity));
        }
        if (Number.isFinite(max)) maxToSell.set(location.id, Math.max(0, max));
      }
      for (const line of lines) {
        cost +=
          (variantsById.get(line.componentVariantId)?.cost ?? 0) *
          line.quantity;
      }
      result.set(product.id, {
        cost: Math.round(cost * 100) / 100,
        tracksQuantity: lines.some(
          (line) =>
            variantsById.get(line.componentVariantId)?.product.trackQuantity,
        ),
        maxToSell,
        componentVariants: new Map(
          lines
            .map((line) => variantsById.get(line.componentVariantId))
            .filter((variant): variant is ProductVariant => Boolean(variant))
            .map((variant) => [variant.id, variant]),
        ),
      });
    }
    return result;
  }

  private async deleteImages(urls: string[]): Promise<void> {
    await Promise.all(
      urls.map((url) => this.storageService.deleteByDownloadUrl(url)),
    );
  }
}
