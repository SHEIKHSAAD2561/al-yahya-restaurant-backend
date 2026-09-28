import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/category.entity';
import { Location } from '../locations/location.entity';
import { CompanyService } from '../company/company.service';
import { QueryDigitalMenuDto } from './dto/query-digital-menu.dto';

export interface DigitalMenuVariant {
  id: string;
  optionValues: string[] | null;
  price: number;
  inStock: boolean;
}

export interface DigitalMenuProduct {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  minPrice: number;
  maxPrice: number;
  variants: DigitalMenuVariant[];
}

@Injectable()
export class DigitalMenuService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    private readonly companyService: CompanyService,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  /** Narrow, public list for the menu's location switcher — id/name only,
   * same "public and permission-free on purpose" reasoning as
   * `CompanyController.getBranding()`: nothing here is sensitive. */
  async listPublicLocations(): Promise<{ id: string; name: string }[]> {
    return this.locationRepository.find({
      where: { isActive: true },
      select: { id: true, name: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Builds the whole public menu in one call: branding, the resolved
   * location, a flat category list (the frontend already has
   * `buildCategoryTree()`/`categoryPath()` from Category Management to nest
   * this client-side — no need to duplicate that here), and every sellable
   * product that has at least one variant priced at this location.
   *
   * A product with zero priced variants at this location is silently
   * excluded (same "no price at location" rule `SalesService` enforces at
   * checkout) rather than shown with a missing price. An out-of-stock
   * variant (`trackQuantity` on and `quantity <= 0`) stays on the menu with
   * `inStock: false` instead of disappearing — closer to how a real
   * restaurant menu marks something "Sold Out" than silently hiding it.
   */
  async getMenu(query: QueryDigitalMenuDto) {
    const location = query.locationId
      ? await this.locationRepository.findOne({ where: { id: query.locationId, isActive: true } })
      : await this.locationRepository.findOne({ where: { isDefault: true } });
    if (!location) {
      throw new NotFoundException(this.t('digital_menu.location_not_found'));
    }

    const [company, categories, products] = await Promise.all([
      this.companyService.findOrCreate(),
      this.categoryRepository.find({ order: { name: 'ASC' } }),
      this.productRepository.find({
        where: { isSellable: true },
        relations: { images: true, variants: { locations: true } },
        order: { name: 'ASC' },
      }),
    ]);

    const menuProducts: DigitalMenuProduct[] = [];
    for (const product of products) {
      const variants: DigitalMenuVariant[] = [];
      for (const variant of product.variants) {
        const row = variant.locations.find((l) => l.locationId === location.id);
        if (!row || row.retailPrice === null) continue;
        variants.push({
          id: variant.id,
          optionValues: variant.optionValues,
          price: Number(row.retailPrice),
          inStock: !product.trackQuantity || Number(row.quantity) > 0,
        });
      }
      if (variants.length === 0) continue;

      const sortedImages = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
      const prices = variants.map((v) => v.price);
      menuProducts.push({
        id: product.id,
        name: product.name,
        description: product.description,
        imageUrl: sortedImages[0]?.url ?? null,
        categoryId: product.categoryId,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        variants,
      });
    }

    return {
      branding: {
        name: company.name,
        logoUrl: company.logoUrl,
        address: company.address,
        phone: company.phone,
      },
      location: { id: location.id, name: location.name },
      categories: categories.map((category) => ({ id: category.id, name: category.name, parentId: category.parentId })),
      products: menuProducts,
    };
  }
}
