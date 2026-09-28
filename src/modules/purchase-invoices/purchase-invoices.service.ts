import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { PurchaseInvoice } from './entities/purchase-invoice.entity';
import { PurchaseInvoiceLine } from './entities/purchase-invoice-line.entity';
import { PurchaseInvoiceStatus } from './purchase-invoice-status.enum';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { UpdatePurchaseInvoiceDto } from './dto/update-purchase-invoice.dto';
import { QueryPurchaseInvoicesDto } from './dto/query-purchase-invoices.dto';
import { Supplier } from '../suppliers/supplier.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { VariantLocation } from '../products/entities/variant-location.entity';
import { ProductType } from '../products/product-type.enum';
import { Tax } from '../taxes/tax.entity';
import { TaxStatus } from '../configuration/configuration.enums';
import {
  effectiveTaxRate,
  computeLineTax,
} from '../taxes/tax-calculation.util';
import type { RequestUser } from '../../common/types/authenticated-request';

interface ResolvedPurchaseLine {
  variantId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  taxId: string | null;
  taxRate: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

@Injectable()
export class PurchaseInvoicesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PurchaseInvoice)
    private readonly purchaseInvoiceRepository: Repository<PurchaseInvoice>,
    @InjectRepository(PurchaseInvoiceLine)
    private readonly lineRepository: Repository<PurchaseInvoiceLine>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(VariantLocation)
    private readonly variantLocationRepository: Repository<VariantLocation>,
    @InjectRepository(Tax)
    private readonly taxRepository: Repository<Tax>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  // ------------------------------------------------------------------ list

  async findAll(query: QueryPurchaseInvoicesDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const qb = this.purchaseInvoiceRepository
      .createQueryBuilder('invoice')
      .innerJoinAndSelect('invoice.supplier', 'supplier')
      .innerJoinAndSelect('invoice.location', 'location')
      .orderBy('invoice.createdAt', 'DESC');

    if (query.supplierId)
      qb.andWhere('invoice.supplierId = :supplierId', {
        supplierId: query.supplierId,
      });
    if (query.locationId)
      qb.andWhere('invoice.locationId = :locationId', {
        locationId: query.locationId,
      });
    if (query.status)
      qb.andWhere('invoice.status = :status', { status: query.status });

    const [invoices, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        supplierId: invoice.supplierId,
        supplierName: invoice.supplier!.name,
        locationId: invoice.locationId,
        locationName: invoice.location!.name,
        invoiceDate: invoice.invoiceDate,
        total: invoice.total,
        createdAt: invoice.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOneOrFail(id: string): Promise<PurchaseInvoice> {
    const invoice = await this.purchaseInvoiceRepository.findOne({
      where: { id },
      relations: {
        supplier: true,
        location: true,
        lines: true,
        createdBy: true,
      },
    });
    if (!invoice) {
      throw new NotFoundException(this.t('purchase_invoices.not_found'));
    }
    return invoice;
  }

  // ---------------------------------------------------------- line resolve

  /** Unlike `SalesService.resolveLines()`, a purchase line's price (unitCost)
   * is exactly what the caller typed — there's no catalog price to re-resolve
   * against, this *is* how the catalog cost gets set. Only tax is looked up. */
  private async resolveLines(
    dto: CreatePurchaseInvoiceDto,
  ): Promise<ResolvedPurchaseLine[]> {
    const variantIds = dto.lines.map((line) => line.variantId);
    if (new Set(variantIds).size !== variantIds.length) {
      throw new BadRequestException(this.t('purchase_invoices.duplicate_line'));
    }
    const variants = await this.variantRepository.find({
      where: { id: In(variantIds) },
      relations: { product: true },
    });
    const variantsById = new Map(
      variants.map((variant) => [variant.id, variant]),
    );

    const taxIds = [
      ...new Set(
        dto.lines
          .map((line) => line.taxId)
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

    return dto.lines.map((line) => {
      const variant = variantsById.get(line.variantId);
      if (!variant) {
        throw new BadRequestException(this.t('products.not_found'));
      }
      if (variant.product.type === ProductType.COMPOSITE) {
        throw new BadRequestException(
          `${this.t('purchase_invoices.composite_not_purchasable')} (${variant.sku})`,
        );
      }
      const tax = line.taxId ? taxesById.get(line.taxId) : undefined;
      const taxRate = tax ? effectiveTaxRate(tax) : 0;
      // Purchase costs are always tax-exclusive (see Configuration's
      // costTaxStatus — always EXCLUSIVE, no matching toggle).
      const {
        subtotal,
        tax: lineTax,
        total,
      } = computeLineTax(
        line.unitCost,
        line.quantity,
        taxRate,
        TaxStatus.EXCLUSIVE,
      );
      return {
        variantId: variant.id,
        productName: variant.product.name,
        sku: variant.sku,
        quantity: line.quantity,
        unitCost: line.unitCost,
        taxId: line.taxId ?? null,
        taxRate,
        lineSubtotal: subtotal,
        lineTax,
        lineTotal: total,
      };
    });
  }

  private computeTotals(lines: ResolvedPurchaseLine[]) {
    const round = (value: number) => Math.round(value * 100) / 100;
    return {
      subtotal: round(lines.reduce((sum, line) => sum + line.lineSubtotal, 0)),
      taxAmount: round(lines.reduce((sum, line) => sum + line.lineTax, 0)),
      total: round(lines.reduce((sum, line) => sum + line.lineTotal, 0)),
    };
  }

  private buildLineEntities(
    purchaseInvoiceId: string,
    lines: ResolvedPurchaseLine[],
  ): PurchaseInvoiceLine[] {
    return lines.map((line) =>
      this.lineRepository.create({
        purchaseInvoiceId,
        variantId: line.variantId,
        productName: line.productName,
        sku: line.sku,
        quantity: line.quantity,
        unitCost: line.unitCost,
        taxId: line.taxId,
        taxRate: line.taxRate,
        lineSubtotal: line.lineSubtotal,
        lineTax: line.lineTax,
        lineTotal: line.lineTotal,
      }),
    );
  }

  // ------------------------------------------------------------------ crud

  async create(
    dto: CreatePurchaseInvoiceDto,
    user: RequestUser,
  ): Promise<PurchaseInvoice> {
    if (
      !(await this.supplierRepository.exists({ where: { id: dto.supplierId } }))
    ) {
      throw new BadRequestException(
        this.t('purchase_invoices.supplier_not_found'),
      );
    }
    const resolved = await this.resolveLines(dto);
    const totals = this.computeTotals(resolved);
    const wantsConfirmed = dto.status === PurchaseInvoiceStatus.CONFIRMED;

    return this.dataSource.transaction(async (manager) => {
      const invoice = manager.create(PurchaseInvoice, {
        supplierId: dto.supplierId,
        locationId: dto.locationId,
        invoiceDate: dto.invoiceDate,
        notes: dto.notes?.trim() || null,
        status: PurchaseInvoiceStatus.DRAFT,
        createdByUserId: user.id,
        ...totals,
      });
      const saved = await manager.save(invoice);
      await manager.save(this.buildLineEntities(saved.id, resolved));

      if (wantsConfirmed) {
        return this.applyConfirmation(manager, saved.id, resolved);
      }
      return saved;
    });
  }

  async update(
    id: string,
    dto: UpdatePurchaseInvoiceDto,
  ): Promise<PurchaseInvoice> {
    const invoice = await this.purchaseInvoiceRepository.findOne({
      where: { id },
    });
    if (!invoice) {
      throw new NotFoundException(this.t('purchase_invoices.not_found'));
    }
    if (invoice.status !== PurchaseInvoiceStatus.DRAFT) {
      throw new BadRequestException(this.t('purchase_invoices.not_editable'));
    }

    return this.dataSource.transaction(async (manager) => {
      if (dto.supplierId !== undefined) invoice.supplierId = dto.supplierId;
      if (dto.locationId !== undefined) invoice.locationId = dto.locationId;
      if (dto.invoiceDate !== undefined) invoice.invoiceDate = dto.invoiceDate;
      if (dto.notes !== undefined) invoice.notes = dto.notes?.trim() || null;

      if (dto.lines !== undefined) {
        const resolved = await this.resolveLines({
          supplierId: invoice.supplierId,
          locationId: invoice.locationId,
          invoiceDate: invoice.invoiceDate,
          lines: dto.lines,
        });
        Object.assign(invoice, this.computeTotals(resolved));
        await manager.delete(PurchaseInvoiceLine, { purchaseInvoiceId: id });
        await manager.save(this.buildLineEntities(id, resolved));
      }
      return manager.save(invoice);
    });
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.purchaseInvoiceRepository.findOne({
      where: { id },
    });
    if (!invoice) {
      throw new NotFoundException(this.t('purchase_invoices.not_found'));
    }
    if (invoice.status !== PurchaseInvoiceStatus.DRAFT) {
      throw new BadRequestException(this.t('purchase_invoices.not_editable'));
    }
    await this.purchaseInvoiceRepository.delete(id);
  }

  // -------------------------------------------------------------- confirm

  async confirm(id: string): Promise<PurchaseInvoice> {
    const invoice = await this.purchaseInvoiceRepository.findOne({
      where: { id },
      relations: { lines: true },
    });
    if (!invoice) {
      throw new NotFoundException(this.t('purchase_invoices.not_found'));
    }
    if (invoice.status !== PurchaseInvoiceStatus.DRAFT) {
      throw new BadRequestException(
        this.t('purchase_invoices.already_confirmed'),
      );
    }
    const resolved: ResolvedPurchaseLine[] = invoice.lines.map((line) => ({
      variantId: line.variantId,
      productName: line.productName,
      sku: line.sku,
      quantity: line.quantity,
      unitCost: line.unitCost,
      taxId: line.taxId,
      taxRate: line.taxRate,
      lineSubtotal: line.lineSubtotal,
      lineTax: line.lineTax,
      lineTotal: line.lineTotal,
    }));
    return this.dataSource.transaction((manager) =>
      this.applyConfirmation(manager, id, resolved),
    );
  }

  /** Assigns the invoice number, increases each line's variant's stock **at
   * this invoice's location**, and recomputes each variant's
   * weighted-average `cost` **across all locations combined** (cost is one
   * global column on `ProductVariant`, not per-location — see the Products
   * section of this doc). Runs inside the caller's transaction. */
  private async applyConfirmation(
    manager: EntityManager,
    invoiceId: string,
    lines: ResolvedPurchaseLine[],
  ): Promise<PurchaseInvoice> {
    const invoice = await manager.findOneOrFail(PurchaseInvoice, {
      where: { id: invoiceId },
    });

    for (const line of lines) {
      const variant = await manager.findOneOrFail(ProductVariant, {
        where: { id: line.variantId },
      });
      const existingLocations = await manager.find(VariantLocation, {
        where: { variantId: line.variantId },
      });
      const existingTotalQty = existingLocations.reduce(
        (sum, row) => sum + row.quantity,
        0,
      );

      const newTotalQty = existingTotalQty + line.quantity;
      const newAverageCost =
        newTotalQty > 0
          ? Math.round(
              ((existingTotalQty * variant.cost +
                line.quantity * line.unitCost) /
                newTotalQty) *
                100,
            ) / 100
          : variant.cost;
      await manager.update(ProductVariant, variant.id, {
        cost: newAverageCost,
      });

      const targetRow = existingLocations.find(
        (row) => row.locationId === invoice.locationId,
      );
      if (targetRow) {
        await manager.update(VariantLocation, targetRow.id, {
          quantity: targetRow.quantity + line.quantity,
        });
      } else {
        await manager.save(
          manager.create(VariantLocation, {
            variantId: line.variantId,
            locationId: invoice.locationId,
            quantity: line.quantity,
          }),
        );
      }
    }

    invoice.status = PurchaseInvoiceStatus.CONFIRMED;
    invoice.confirmedAt = new Date();
    invoice.invoiceNumber = await this.nextInvoiceNumber(manager);
    return manager.save(invoice);
  }

  /** "P{YYYYMMDD}-{n}", assigned only on confirmation — same same-day
   * counting approach as `SalesService.nextInvoiceNumber()` (not race-proof
   * under heavy concurrent confirmations on the same day, acceptable at this
   * scale). */
  private async nextInvoiceNumber(manager: EntityManager): Promise<string> {
    const today = new Date();
    const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const todaysCount = await manager
      .createQueryBuilder(PurchaseInvoice, 'invoice')
      .where('invoice.invoiceNumber LIKE :prefix', { prefix: `P${datePart}-%` })
      .getCount();
    return `P${datePart}-${todaysCount + 1}`;
  }
}
