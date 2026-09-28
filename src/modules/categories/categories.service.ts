import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, IsNull, Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateCategoryTreeDto } from './dto/create-category-tree.dto';
import { CategoryTreeNodeDto } from './dto/category-tree-node.dto';
import { Product } from '../products/entities/product.entity';

/** Parent → child → sub-child — matches the "+ Add child category" /
 * "+ Add sub-child" buttons in the "Category tree" dialog (there's no
 * "+ Add sub-sub-child"). Enforced here, not just in the UI. */
export const MAX_CATEGORY_DEPTH = 3;

export interface CategoryResponse {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  /** 1 = top-level, up to MAX_CATEGORY_DEPTH. */
  depth: number;
  /** Products filed directly under this category — not counting descendants'. */
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CategoriesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  async findAll(): Promise<CategoryResponse[]> {
    const [categories, counts] = await Promise.all([
      this.categoryRepository.find({ order: { name: 'ASC' } }),
      this.productRepository
        .createQueryBuilder('product')
        .select('product.categoryId', 'categoryId')
        .addSelect('COUNT(*)', 'count')
        .where('product.categoryId IS NOT NULL')
        .groupBy('product.categoryId')
        .getRawMany<{ categoryId: string; count: string }>(),
    ]);

    const byId = new Map(categories.map((category) => [category.id, category]));
    const countByCategory = new Map(
      counts.map((row) => [row.categoryId, Number(row.count)]),
    );
    const depthOf = (id: string | null): number => {
      let depth = 0;
      let current = id;
      while (current) {
        depth++;
        current = byId.get(current)?.parentId ?? null;
      }
      return depth;
    };

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      parentId: category.parentId,
      depth: depthOf(category.id),
      productCount: countByCategory.get(category.id) ?? 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));
  }

  async getUncategorizedCount(): Promise<number> {
    return this.productRepository.countBy({ categoryId: IsNull() });
  }

  /** Individual creation — optionally under an existing `parentId`, and
   * optionally assigning products to it in the same transaction ("Create
   * category & assign" on the Uncategorized banner). */
  async create(dto: CreateCategoryDto): Promise<Category> {
    const name = dto.name.trim();
    const parentId = dto.parentId ?? null;

    if (parentId) {
      const parentDepth = await this.depthOf(parentId);
      if (parentDepth >= MAX_CATEGORY_DEPTH) {
        throw new BadRequestException(
          this.t('products.category_depth_exceeded'),
        );
      }
    }
    await this.assertNameAvailable(name, parentId);

    return this.dataSource.transaction(async (manager) => {
      const created = await manager.save(
        manager.create(Category, {
          name,
          description: dto.description?.trim() || null,
          parentId,
        }),
      );
      if (dto.assignProductIds && dto.assignProductIds.length > 0) {
        await this.setCategoryOnProducts(
          manager,
          created.id,
          dto.assignProductIds,
        );
      }
      return created;
    });
  }

  /**
   * "Category tree": `parentName` extends an existing top-level category with
   * that name, or creates a new one — either way that's level 1. `children`
   * (level 2) and their own `children` (level 3) are always newly created.
   * The whole call is one transaction, so a depth violation partway through
   * a large tree doesn't leave a half-built branch behind.
   */
  async createTree(dto: CreateCategoryTreeDto): Promise<Category> {
    return this.dataSource.transaction(async (manager) => {
      const parentName = dto.parentName.trim();
      let parent = await manager.findOne(Category, {
        where: { name: parentName, parentId: IsNull() },
      });
      if (!parent) {
        parent = await manager.save(
          manager.create(Category, { name: parentName, parentId: null }),
        );
      }
      if (dto.children && dto.children.length > 0) {
        await this.createChildren(manager, parent.id, dto.children, 2);
      }
      return parent;
    });
  }

  private async createChildren(
    manager: EntityManager,
    parentId: string,
    nodes: CategoryTreeNodeDto[],
    depth: number,
  ): Promise<void> {
    if (depth > MAX_CATEGORY_DEPTH) {
      throw new BadRequestException(this.t('products.category_depth_exceeded'));
    }
    const names = nodes.map((node) => node.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      throw new BadRequestException(this.t('products.duplicate_category_name'));
    }

    for (const node of nodes) {
      const name = node.name.trim();
      const existing = await manager.exists(Category, {
        where: { name, parentId },
      });
      if (existing) {
        throw new ConflictException(this.t('products.category_name_taken'));
      }
      const created = await manager.save(
        manager.create(Category, { name, parentId }),
      );
      if (node.children && node.children.length > 0) {
        await this.createChildren(
          manager,
          created.id,
          node.children,
          depth + 1,
        );
      }
    }
  }

  async assignProducts(
    categoryId: string,
    productIds: string[],
  ): Promise<{ updated: number }> {
    if (
      !(await this.categoryRepository.exists({ where: { id: categoryId } }))
    ) {
      throw new NotFoundException(this.t('products.category_not_found'));
    }
    const updated = await this.dataSource.transaction((manager) =>
      this.setCategoryOnProducts(manager, categoryId, productIds),
    );
    return { updated };
  }

  async unassignProducts(productIds: string[]): Promise<{ updated: number }> {
    const updated = await this.dataSource.transaction((manager) =>
      this.setCategoryOnProducts(manager, null, productIds),
    );
    return { updated };
  }

  private async setCategoryOnProducts(
    manager: EntityManager,
    categoryId: string | null,
    productIds: string[],
  ): Promise<number> {
    const uniqueIds = [...new Set(productIds)];
    const count = await manager
      .getRepository(Product)
      .countBy({ id: In(uniqueIds) });
    if (count !== uniqueIds.length) {
      throw new BadRequestException(this.t('products.product_not_found'));
    }
    await manager.update(Product, { id: In(uniqueIds) }, { categoryId });
    return uniqueIds.length;
  }

  /** The given category's own depth (1 = top-level) — used to check whether
   * a *new* child under it (depth + 1) would exceed MAX_CATEGORY_DEPTH. */
  private async depthOf(categoryId: string): Promise<number> {
    let depth = 0;
    let current: Category | null = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!current) {
      throw new BadRequestException(this.t('products.category_not_found'));
    }
    while (current) {
      depth++;
      current = current.parentId
        ? await this.categoryRepository.findOne({
            where: { id: current.parentId },
          })
        : null;
    }
    return depth;
  }

  private async assertNameAvailable(
    name: string,
    parentId: string | null,
  ): Promise<void> {
    const where = parentId ? { name, parentId } : { name, parentId: IsNull() };
    if (await this.categoryRepository.exists({ where })) {
      throw new ConflictException(this.t('products.category_name_taken'));
    }
  }
}
