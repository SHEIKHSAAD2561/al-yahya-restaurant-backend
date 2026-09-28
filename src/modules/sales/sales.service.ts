import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  Brackets,
  DataSource,
  EntityManager,
  In,
  Repository,
} from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Sale } from './entities/sale.entity';
import { SaleLine } from './entities/sale-line.entity';
import { DiscountType, SaleStatus, SellAt } from './sale-enums';
import { ParkSaleDto } from './dto/park-sale.dto';
import { CheckoutSaleDto } from './dto/checkout-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { CheckoutLineDto } from './dto/checkout-line.dto';
import { Register } from '../registers/entities/register.entity';
import { RegisterSession } from '../registers/entities/register-session.entity';
import { RegisterSessionStatus } from '../registers/register-enums';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { VariantLocation } from '../products/entities/variant-location.entity';
import { CompositeComponent } from '../products/entities/composite-component.entity';
import { ProductType } from '../products/product-type.enum';
import { Tax } from '../taxes/tax.entity';
import { Customer } from '../customers/customer.entity';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import { ConfigurationService } from '../configuration/configuration.service';
import { SaleSettingsService } from '../sale-settings/sale-settings.service';
import { toCsv } from '../../common/utils/csv.util';
import {
  effectiveTaxRate,
  computeLineTax,
} from '../taxes/tax-calculation.util';
import type { RequestUser } from '../../common/types/authenticated-request';

const MAX_EXPORT_ROWS = 5000;

interface ResolvedLine {
  variantId: string;
  productType: ProductType;
  trackQuantity: boolean;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  taxId: string | null;
  taxRate: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

@Injectable()
export class SalesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleLine)
    private readonly saleLineRepository: Repository<SaleLine>,
    @InjectRepository(Register)
    private readonly registerRepository: Repository<Register>,
    @InjectRepository(RegisterSession)
    private readonly sessionRepository: Repository<RegisterSession>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(VariantLocation)
    private readonly variantLocationRepository: Repository<VariantLocation>,
    @InjectRepository(CompositeComponent)
    private readonly componentRepository: Repository<CompositeComponent>,
    @InjectRepository(Tax)
    private readonly taxRepository: Repository<Tax>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    private readonly configurationService: ConfigurationService,
    private readonly saleSettingsService: SaleSettingsService,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  // ------------------------------------------------------------------ park

  async park(dto: ParkSaleDto, user: RequestUser): Promise<Sale> {
    const { register, session } = await this.loadOpenSessionForCashier(
      dto.registerId,
      user.id,
    );
    this.assertLinePermissions(dto, user);
    if (dto.customerId) await this.assertCustomerExists(dto.customerId);

    const resolved = await this.resolveLines(
      register.locationId,
      dto.sellAt,
      dto.lines,
    );
    const totals = this.computeTotals(
      resolved,
      dto.discountType,
      dto.discountValue,
    );

    return this.dataSource.transaction(async (manager) => {
      let sale: Sale;
      if (dto.id) {
        sale = await this.loadParkedSaleOrFail(manager, dto.id);
      } else {
        sale = manager.create(Sale, {
          registerId: register.id,
          cashierUserId: user.id,
        });
      }
      sale.registerSessionId = session.id;
      sale.customerId = dto.customerId ?? null;
      sale.sellAt = dto.sellAt;
      sale.discountType = dto.discountType ?? null;
      sale.discountValue = dto.discountValue ?? null;
      sale.note = dto.note?.trim() || null;
      sale.status = SaleStatus.PARKED;
      Object.assign(sale, totals);

      if (sale.id) await manager.delete(SaleLine, { saleId: sale.id });
      const saved = await manager.save(sale);
      await manager.save(this.buildLineEntities(saved.id, resolved));
      return saved;
    });
  }

  async listParked(registerId: string) {
    const sales = await this.saleRepository.find({
      where: { registerId, status: SaleStatus.PARKED },
      relations: { customer: true, lines: true },
      order: { updatedAt: 'DESC' },
    });
    return sales.map((sale) => ({
      id: sale.id,
      customerName: sale.customer?.name ?? null,
      itemCount: sale.lines.length,
      total: sale.total,
      parkedAt: sale.updatedAt,
    }));
  }

  async getParkedDetail(id: string) {
    const sale = await this.saleRepository.findOne({
      where: { id, status: SaleStatus.PARKED },
      relations: { lines: true, customer: true },
    });
    if (!sale) {
      throw new NotFoundException(this.t('sales.parked_not_found'));
    }
    // Resuming needs the customer's name to display, not just their id.
    return { ...sale, customerName: sale.customer?.name ?? null };
  }

  async discardParked(id: string): Promise<void> {
    const sale = await this.saleRepository.findOne({ where: { id } });
    if (!sale || sale.status !== SaleStatus.PARKED) {
      throw new NotFoundException(this.t('sales.parked_not_found'));
    }
    await this.saleRepository.delete(id);
  }

  // -------------------------------------------------------------- checkout

  async checkout(dto: CheckoutSaleDto, user: RequestUser): Promise<Sale> {
    const { register, session } = await this.loadOpenSessionForCashier(
      dto.registerId,
      user.id,
    );
    this.assertLinePermissions(dto, user);
    if (dto.customerId) await this.assertCustomerExists(dto.customerId);

    if (dto.isPostPayment) {
      if (!user.permissionCodes.has('pos.checkout_post_payment')) {
        throw new ForbiddenException(this.t('sales.post_payment_not_allowed'));
      }
      if (!dto.customerId) {
        throw new BadRequestException(
          this.t('sales.post_payment_requires_customer'),
        );
      }
    }

    let paymentMethod: PaymentMethod | undefined;
    if (!dto.isPostPayment) {
      paymentMethod = register.paymentMethods.find(
        (method) => method.id === dto.paymentMethodId,
      );
      if (!paymentMethod) {
        throw new BadRequestException(
          this.t('sales.payment_method_not_assigned'),
        );
      }
    }

    const resolved = await this.resolveLines(
      register.locationId,
      dto.sellAt,
      dto.lines,
    );
    const totals = this.computeTotals(
      resolved,
      dto.discountType,
      dto.discountValue,
    );

    if (!dto.isPostPayment && dto.amountTendered! < totals.total) {
      throw new BadRequestException(this.t('sales.insufficient_payment'));
    }

    const deductions = await this.resolveStockDeductions(resolved);
    const saleSettings = await this.saleSettingsService.get();

    return this.dataSource.transaction(async (manager) => {
      await this.applyStockDeductions(
        manager,
        register.locationId,
        deductions,
        saleSettings.sellWhenQuantityZeroOrBelow,
      );

      let sale: Sale;
      if (dto.resumedFromSaleId) {
        sale = await this.loadParkedSaleOrFail(manager, dto.resumedFromSaleId);
        await manager.delete(SaleLine, { saleId: sale.id });
      } else {
        sale = manager.create(Sale, {
          registerId: register.id,
          cashierUserId: user.id,
        });
      }

      sale.registerSessionId = session.id;
      sale.customerId = dto.customerId ?? null;
      sale.sellAt = dto.sellAt;
      sale.discountType = dto.discountType ?? null;
      sale.discountValue = dto.discountValue ?? null;
      sale.note = dto.note?.trim() || null;
      sale.status = SaleStatus.COMPLETED;
      sale.paymentMethodId = dto.isPostPayment ? null : paymentMethod!.id;
      sale.amountTendered = dto.isPostPayment ? 0 : dto.amountTendered!;
      sale.amountPaid = dto.isPostPayment ? 0 : totals.total;
      sale.completedAt = new Date();
      sale.invoiceNumber = await this.nextInvoiceNumber(manager);
      Object.assign(sale, totals);

      const saved = await manager.save(sale);
      await manager.save(this.buildLineEntities(saved.id, resolved));
      return saved;
    });
  }

  // ------------------------------------------------------------------ list

  private buildSalesQuery(query: QuerySalesDto) {
    const qb = this.saleRepository
      .createQueryBuilder('sale')
      .innerJoinAndSelect('sale.register', 'register')
      .innerJoinAndSelect('register.location', 'location')
      .leftJoinAndSelect('sale.customer', 'customer')
      .leftJoinAndSelect('sale.paymentMethod', 'paymentMethod')
      .leftJoin('sale.lines', 'line')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED });

    if (query.dateFrom || query.dateTo) {
      const from = query.dateFrom ? new Date(query.dateFrom) : new Date(0);
      const to = query.dateTo
        ? new Date(`${query.dateTo}T23:59:59.999`)
        : new Date();
      qb.andWhere('sale.createdAt BETWEEN :from AND :to', { from, to });
    }
    if (query.invoiceNumber?.trim()) {
      qb.andWhere('sale.invoiceNumber LIKE :invoiceNumber', {
        invoiceNumber: `%${query.invoiceNumber.trim()}%`,
      });
    }
    if (query.paymentMethodId) {
      qb.andWhere('sale.paymentMethodId = :paymentMethodId', {
        paymentMethodId: query.paymentMethodId,
      });
    }
    if (query.locationId) {
      qb.andWhere('register.locationId = :locationId', {
        locationId: query.locationId,
      });
    }
    if (query.registerSessionId) {
      qb.andWhere('sale.registerSessionId = :registerSessionId', {
        registerSessionId: query.registerSessionId,
      });
    }
    if (query.sellAt) {
      qb.andWhere('sale.sellAt = :sellAt', { sellAt: query.sellAt });
    }
    if (query.customerSearch?.trim()) {
      const search = `%${query.customerSearch.trim()}%`;
      qb.andWhere(
        new Brackets((where) => {
          where
            .where('customer.name LIKE :search', { search })
            .orWhere('customer.phone LIKE :search', { search })
            .orWhere('customer.code LIKE :search', { search });
        }),
      );
    }
    if (query.productName?.trim() || query.productSku?.trim()) {
      if (query.productName?.trim()) {
        qb.andWhere('line.productName LIKE :productName', {
          productName: `%${query.productName.trim()}%`,
        });
      }
      if (query.productSku?.trim()) {
        qb.andWhere('line.sku LIKE :productSku', {
          productSku: `%${query.productSku.trim()}%`,
        });
      }
      qb.distinct(true);
    }

    return qb.orderBy('sale.createdAt', 'DESC');
  }

  private toSaleListItem(sale: Sale) {
    return {
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      createdAt: sale.createdAt,
      paymentMethodName: sale.paymentMethod?.name ?? '',
      customerName: sale.customer?.name ?? null,
      // Always populated — innerJoinAndSelect'd above.
      locationId: sale.register!.locationId,
      locationName: sale.register!.location!.name,
      sellAt: sale.sellAt,
      total: sale.total,
      amountPaid: sale.amountPaid,
      status: sale.status,
    };
  }

  async findAll(query: QuerySalesDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const [sales, total] = await this.buildSalesQuery(query)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: sales.map((sale) => this.toSaleListItem(sale)),
      total,
      page,
      pageSize,
    };
  }

  async exportCsv(query: QuerySalesDto): Promise<string> {
    const sales = await this.buildSalesQuery(query)
      .take(MAX_EXPORT_ROWS)
      .getMany();

    const header = [
      'Invoice Number',
      'Date',
      'Location',
      'Sale Type',
      'Payment Method',
      'Customer',
      'Total',
      'Amount Paid',
    ];
    const rows = sales.map((sale) => {
      const item = this.toSaleListItem(sale);
      return [
        item.invoiceNumber ?? '',
        item.createdAt.toISOString(),
        item.locationName,
        item.sellAt,
        item.paymentMethodName,
        item.customerName ?? '',
        item.total.toFixed(2),
        (item.amountPaid ?? 0).toFixed(2),
      ];
    });
    return '﻿' + toCsv([header, ...rows]);
  }

  /** Full detail for the Invoice Details page / receipt printing — the raw
   * entity plus `cashierName`/`customerName`/`paymentMethodName` so the
   * frontend never needs to know `User`'s or `PaymentMethod`'s own shape
   * just to print a name. */
  async findOneOrFail(id: string) {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: {
        lines: true,
        customer: true,
        paymentMethod: true,
        cashier: true,
      },
    });
    if (!sale) {
      throw new NotFoundException(this.t('sales.not_found'));
    }
    return {
      ...sale,
      cashierName: sale.cashier?.nameEn ?? '',
      customerName: sale.customer?.name ?? null,
      paymentMethodName: sale.paymentMethod?.name ?? null,
      cashier: undefined,
      customer: undefined,
      paymentMethod: undefined,
    };
  }

  // --------------------------------------------------------------- helpers

  private async loadOpenSessionForCashier(
    registerId: string,
    userId: string,
  ): Promise<{ register: Register; session: RegisterSession }> {
    const register = await this.registerRepository.findOne({
      where: { id: registerId },
      relations: { cashiers: true, paymentMethods: true },
    });
    if (!register) {
      throw new NotFoundException(this.t('registers.not_found'));
    }
    if (!register.cashiers.some((cashier) => cashier.id === userId)) {
      throw new ForbiddenException(this.t('registers.not_a_cashier'));
    }
    const session = await this.sessionRepository.findOne({
      where: { registerId, status: RegisterSessionStatus.OPEN },
    });
    if (!session) {
      throw new BadRequestException(this.t('registers.not_open'));
    }
    return { register, session };
  }

  private assertLinePermissions(
    dto: Pick<
      ParkSaleDto,
      'sellAt' | 'discountType' | 'discountValue' | 'lines'
    >,
    user: RequestUser,
  ): void {
    if (
      dto.sellAt === SellAt.WHOLESALE &&
      !user.permissionCodes.has('pos.sell_wholesale')
    ) {
      throw new ForbiddenException(this.t('sales.wholesale_not_allowed'));
    }
    const hasPriceOverride = dto.lines.some(
      (line) => line.unitPriceOverride !== undefined,
    );
    const hasDiscount =
      dto.discountType !== undefined || dto.discountValue !== undefined;
    if (
      (hasPriceOverride || hasDiscount) &&
      !user.permissionCodes.has('pos.edit_prices_discounts')
    ) {
      throw new ForbiddenException(this.t('sales.price_edit_not_allowed'));
    }
  }

  private async assertCustomerExists(customerId: string): Promise<void> {
    if (
      !(await this.customerRepository.exists({ where: { id: customerId } }))
    ) {
      throw new BadRequestException(this.t('sales.customer_not_found'));
    }
  }

  private async loadParkedSaleOrFail(
    manager: EntityManager,
    id: string,
  ): Promise<Sale> {
    const sale = await manager.findOne(Sale, {
      where: { id, status: SaleStatus.PARKED },
    });
    if (!sale) {
      throw new NotFoundException(this.t('sales.parked_not_found'));
    }
    return sale;
  }

  /** Resolves every line's true price/tax from the register's location —
   * never trusts a client-displayed price except an explicit, permission-
   * gated override. */
  private async resolveLines(
    locationId: string,
    sellAt: SellAt,
    lines: CheckoutLineDto[],
  ): Promise<ResolvedLine[]> {
    const variantIds = lines.map((line) => line.variantId);
    if (new Set(variantIds).size !== variantIds.length) {
      throw new BadRequestException(this.t('sales.duplicate_line'));
    }

    const [variants, locationRows] = await Promise.all([
      this.variantRepository.find({
        where: { id: In(variantIds) },
        relations: { product: true },
      }),
      this.variantLocationRepository.find({
        where: { variantId: In(variantIds), locationId },
      }),
    ]);
    const variantsById = new Map(
      variants.map((variant) => [variant.id, variant]),
    );
    const rowsByVariant = new Map(
      locationRows.map((row) => [row.variantId, row]),
    );

    const taxIds = [
      ...new Set(
        locationRows
          .map((row) => row.taxId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const taxes = taxIds.length
      ? await this.taxRepository.find({
          where: { id: In(taxIds) },
          relations: { lines: true },
        })
      : [];
    const taxesById = new Map(taxes.map((tax) => [tax.id, tax]));

    const configuration = await this.configurationService.get();
    const costByVariant = await this.resolveVariantCosts(variants);

    return lines.map((line) => {
      const variant = variantsById.get(line.variantId);
      if (!variant) {
        throw new BadRequestException(this.t('products.not_found'));
      }
      if (!variant.product.isSellable) {
        throw new BadRequestException(
          `${this.t('sales.not_sellable')} (${variant.sku})`,
        );
      }
      const row = rowsByVariant.get(line.variantId);
      const basePrice = row
        ? sellAt === SellAt.WHOLESALE
          ? row.wholesalePrice
          : row.retailPrice
        : null;
      if (!row || basePrice === null) {
        throw new BadRequestException(
          `${this.t('sales.no_price_at_location')} (${variant.sku})`,
        );
      }

      const unitPrice = line.unitPriceOverride ?? basePrice;
      const tax = row.taxId ? taxesById.get(row.taxId) : undefined;
      const taxRate = tax ? effectiveTaxRate(tax) : 0;
      const {
        subtotal,
        tax: lineTax,
        total,
      } = computeLineTax(
        unitPrice,
        line.quantity,
        taxRate,
        configuration.sellTaxStatus,
      );

      return {
        variantId: variant.id,
        productType: variant.product.type,
        trackQuantity: variant.product.trackQuantity,
        productName: variant.product.name,
        sku: variant.sku,
        quantity: line.quantity,
        unitPrice,
        unitCost: costByVariant.get(variant.id) ?? 0,
        taxId: row.taxId,
        taxRate,
        lineSubtotal: subtotal,
        lineTax,
        lineTotal: total,
      };
    });
  }

  private computeTotals(
    lines: ResolvedLine[],
    discountType: CheckoutSaleDto['discountType'],
    discountValue: CheckoutSaleDto['discountValue'],
  ) {
    const round = (value: number) => Math.round(value * 100) / 100;
    const subtotal = round(
      lines.reduce((sum, line) => sum + line.lineSubtotal, 0),
    );
    const taxAmount = round(lines.reduce((sum, line) => sum + line.lineTax, 0));

    let discountAmount = 0;
    if (discountType && discountValue) {
      discountAmount =
        discountType === DiscountType.PERCENT
          ? round((subtotal * discountValue) / 100)
          : Math.min(discountValue, subtotal);
    }
    const total = round(subtotal - discountAmount + taxAmount);
    return {
      subtotal,
      discountAmount: round(discountAmount),
      taxAmount,
      total,
    };
  }

  private buildLineEntities(saleId: string, lines: ResolvedLine[]): SaleLine[] {
    return lines.map((line) =>
      this.saleLineRepository.create({
        saleId,
        variantId: line.variantId,
        productName: line.productName,
        sku: line.sku,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        unitCost: line.unitCost,
        taxId: line.taxId,
        taxRate: line.taxRate,
        lineSubtotal: line.lineSubtotal,
        lineTax: line.lineTax,
        lineTotal: line.lineTotal,
      }),
    );
  }

  /** `unitCost` per variant for the set of variants in one checkout/park call
   * — a SIMPLE/VARIABLE variant's own weighted-average `cost`, a COMPOSITE's
   * Σ(component cost × qty), same formula `ProductsService.loadCompositeData()`
   * uses for the product form's read-only cost display, just scoped to only
   * the variants this call needs rather than a full product listing. */
  private async resolveVariantCosts(
    variants: ProductVariant[],
  ): Promise<Map<string, number>> {
    const costByVariant = new Map<string, number>();
    const compositeVariants = variants.filter(
      (variant) => variant.product.type === ProductType.COMPOSITE,
    );
    for (const variant of variants) {
      if (variant.product.type !== ProductType.COMPOSITE) {
        costByVariant.set(variant.id, variant.cost);
      }
    }
    if (compositeVariants.length === 0) return costByVariant;

    const components = await this.componentRepository.find({
      where: {
        productId: In(compositeVariants.map((variant) => variant.productId)),
      },
    });
    const componentVariantIds = [
      ...new Set(components.map((component) => component.componentVariantId)),
    ];
    const componentVariants = componentVariantIds.length
      ? await this.variantRepository.find({
          where: { id: In(componentVariantIds) },
        })
      : [];
    const componentCostById = new Map(
      componentVariants.map((variant) => [variant.id, variant.cost]),
    );
    const componentsByProductId = new Map<string, CompositeComponent[]>();
    for (const component of components) {
      const list = componentsByProductId.get(component.productId) ?? [];
      list.push(component);
      componentsByProductId.set(component.productId, list);
    }
    for (const variant of compositeVariants) {
      const productComponents =
        componentsByProductId.get(variant.productId) ?? [];
      const cost = productComponents.reduce(
        (sum, component) =>
          sum +
          (componentCostById.get(component.componentVariantId) ?? 0) *
            component.quantity,
        0,
      );
      costByVariant.set(variant.id, cost);
    }
    return costByVariant;
  }

  /** Expands each line into the variant(s) whose stock actually moves — a
   * SIMPLE/VARIABLE line deducts itself; a COMPOSITE line deducts its
   * components (a composite never holds its own stock — see Product entity).
   * Aggregated by variant, since two lines (or a composite's components) can
   * point at the same underlying stock. */
  private async resolveStockDeductions(
    lines: ResolvedLine[],
  ): Promise<Map<string, number>> {
    const deductions = new Map<string, number>();
    const add = (variantId: string, quantity: number) =>
      deductions.set(variantId, (deductions.get(variantId) ?? 0) + quantity);

    for (const line of lines) {
      if (line.productType !== ProductType.COMPOSITE) {
        if (line.trackQuantity) add(line.variantId, line.quantity);
        continue;
      }
      const variant = await this.variantRepository.findOne({
        where: { id: line.variantId },
      });
      if (!variant) continue;
      const productComponents = await this.componentRepository.find({
        where: { productId: variant.productId },
      });
      for (const component of productComponents) {
        const componentVariant = await this.variantRepository.findOne({
          where: { id: component.componentVariantId },
          relations: { product: true },
        });
        if (componentVariant?.product.trackQuantity) {
          add(component.componentVariantId, component.quantity * line.quantity);
        }
      }
    }
    return deductions;
  }

  private async applyStockDeductions(
    manager: EntityManager,
    locationId: string,
    deductions: Map<string, number>,
    allowNegativeStock: boolean,
  ): Promise<void> {
    if (deductions.size === 0) return;
    const rows = await manager.find(VariantLocation, {
      where: { variantId: In([...deductions.keys()]), locationId },
    });
    const rowsByVariant = new Map(rows.map((row) => [row.variantId, row]));

    for (const [variantId, quantity] of deductions) {
      const row = rowsByVariant.get(variantId);
      // A missing row (no stock ever recorded at this location) is always
      // rejected — the negative-stock setting only lets an existing balance
      // go below zero, it doesn't fabricate a stock record from nothing.
      if (!row || (!allowNegativeStock && row.quantity < quantity)) {
        const variant = await manager.findOne(ProductVariant, {
          where: { id: variantId },
        });
        throw new BadRequestException(
          `${this.t('sales.insufficient_stock')} (${variant?.sku ?? variantId})`,
        );
      }
      await manager.update(VariantLocation, row.id, {
        quantity: row.quantity - quantity,
      });
    }
  }

  /** "S20260924-1" — per-day sequence, scoped to sales already completed
   * today. Not fully race-proof under heavy concurrent checkouts on the same
   * register (no dedicated sequence table) — acceptable for a single-tenant
   * restaurant's realistic throughput; revisit if that ever changes. */
  private async nextInvoiceNumber(manager: EntityManager): Promise<string> {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    const countToday = await manager.count(Sale, {
      where: {
        status: SaleStatus.COMPLETED,
        completedAt: Between(startOfDay, endOfDay),
      },
    });
    return `S${datePart}-${countToday + 1}`;
  }
}
