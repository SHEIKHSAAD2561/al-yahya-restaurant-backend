import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { ReturnInvoice } from './entities/return-invoice.entity';
import { ReturnInvoiceLine } from './entities/return-invoice-line.entity';
import { ReturnInvoiceStatus } from './return-invoice-status.enum';
import { CreateReturnInvoiceDto } from './dto/create-return-invoice.dto';
import { UpdateReturnInvoiceDto } from './dto/update-return-invoice.dto';
import { QueryReturnInvoicesDto } from './dto/query-return-invoices.dto';
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

interface ResolvedReturnLine {
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
export class ReturnInvoicesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ReturnInvoice)
    private readonly returnInvoiceRepository: Repository<ReturnInvoice>,
    @InjectRepository(ReturnInvoiceLine)
    private readonly lineRepository: Repository<ReturnInvoiceLine>,
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

  async findAll(query: QueryReturnInvoicesDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const qb = this.returnInvoiceRepository
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
        returnNumber: invoice.returnNumber,
        status: invoice.status,
        supplierId: invoice.supplierId,
        supplierName: invoice.supplier!.name,
        locationId: invoice.locationId,
        locationName: invoice.location!.name,
        returnDate: invoice.returnDate,
        total: invoice.total,
        createdAt: invoice.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOneOrFail(id: string): Promise<ReturnInvoice> {
    const invoice = await this.returnInvoiceRepository.findOne({
      where: { id },
      relations: {
        supplier: true,
        location: true,
        lines: true,
        purchaseInvoice: true,
      },
    });
    if (!invoice) {
      throw new NotFoundException(this.t('return_invoices.not_found'));
    }
    return invoice;
  }

  private async resolveLines(
    dto: CreateReturnInvoiceDto,
  ): Promise<ResolvedReturnLine[]> {
    const variantIds = dto.lines.map((line) => line.variantId);
    if (new Set(variantIds).size !== variantIds.length) {
      throw new BadRequestException(this.t('return_invoices.duplicate_line'));
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
          `${this.t('return_invoices.composite_not_returnable')} (${variant.sku})`,
        );
      }
      const tax = line.taxId ? taxesById.get(line.taxId) : undefined;
      const taxRate = tax ? effectiveTaxRate(tax) : 0;
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

  private computeTotals(lines: ResolvedReturnLine[]) {
    const round = (value: number) => Math.round(value * 100) / 100;
    return {
      subtotal: round(lines.reduce((sum, line) => sum + line.lineSubtotal, 0)),
      taxAmount: round(lines.reduce((sum, line) => sum + line.lineTax, 0)),
      total: round(lines.reduce((sum, line) => sum + line.lineTotal, 0)),
    };
  }

  private buildLineEntities(
    returnInvoiceId: string,
    lines: ResolvedReturnLine[],
  ): ReturnInvoiceLine[] {
    return lines.map((line) =>
      this.lineRepository.create({
        returnInvoiceId,
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

  async create(
    dto: CreateReturnInvoiceDto,
    user: RequestUser,
  ): Promise<ReturnInvoice> {
    if (
      !(await this.supplierRepository.exists({ where: { id: dto.supplierId } }))
    ) {
      throw new BadRequestException(
        this.t('return_invoices.supplier_not_found'),
      );
    }
    const resolved = await this.resolveLines(dto);
    const totals = this.computeTotals(resolved);
    const wantsConfirmed = dto.status === ReturnInvoiceStatus.CONFIRMED;

    return this.dataSource.transaction(async (manager) => {
      const invoice = manager.create(ReturnInvoice, {
        supplierId: dto.supplierId,
        locationId: dto.locationId,
        purchaseInvoiceId: dto.purchaseInvoiceId ?? null,
        returnDate: dto.returnDate,
        notes: dto.notes?.trim() || null,
        status: ReturnInvoiceStatus.DRAFT,
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
    dto: UpdateReturnInvoiceDto,
  ): Promise<ReturnInvoice> {
    const invoice = await this.returnInvoiceRepository.findOne({
      where: { id },
    });
    if (!invoice) {
      throw new NotFoundException(this.t('return_invoices.not_found'));
    }
    if (invoice.status !== ReturnInvoiceStatus.DRAFT) {
      throw new BadRequestException(this.t('return_invoices.not_editable'));
    }

    return this.dataSource.transaction(async (manager) => {
      if (dto.supplierId !== undefined) invoice.supplierId = dto.supplierId;
      if (dto.locationId !== undefined) invoice.locationId = dto.locationId;
      if (dto.purchaseInvoiceId !== undefined)
        invoice.purchaseInvoiceId = dto.purchaseInvoiceId;
      if (dto.returnDate !== undefined) invoice.returnDate = dto.returnDate;
      if (dto.notes !== undefined) invoice.notes = dto.notes?.trim() || null;

      if (dto.lines !== undefined) {
        const resolved = await this.resolveLines({
          supplierId: invoice.supplierId,
          locationId: invoice.locationId,
          returnDate: invoice.returnDate,
          lines: dto.lines,
        });
        Object.assign(invoice, this.computeTotals(resolved));
        await manager.delete(ReturnInvoiceLine, { returnInvoiceId: id });
        await manager.save(this.buildLineEntities(id, resolved));
      }
      return manager.save(invoice);
    });
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.returnInvoiceRepository.findOne({
      where: { id },
    });
    if (!invoice) {
      throw new NotFoundException(this.t('return_invoices.not_found'));
    }
    if (invoice.status !== ReturnInvoiceStatus.DRAFT) {
      throw new BadRequestException(this.t('return_invoices.not_editable'));
    }
    await this.returnInvoiceRepository.delete(id);
  }

  async confirm(id: string): Promise<ReturnInvoice> {
    const invoice = await this.returnInvoiceRepository.findOne({
      where: { id },
      relations: { lines: true },
    });
    if (!invoice) {
      throw new NotFoundException(this.t('return_invoices.not_found'));
    }
    if (invoice.status !== ReturnInvoiceStatus.DRAFT) {
      throw new BadRequestException(
        this.t('return_invoices.already_confirmed'),
      );
    }
    const resolved: ResolvedReturnLine[] = invoice.lines.map((line) => ({
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

  /** Decreases stock at this invoice's location — rejects the whole
   * confirmation if any line would go negative (same guard style as
   * `SalesService.applyStockDeductions()`; there's no "sell when below zero"
   * equivalent setting for supplier returns). Cost is untouched. */
  private async applyConfirmation(
    manager: EntityManager,
    invoiceId: string,
    lines: ResolvedReturnLine[],
  ): Promise<ReturnInvoice> {
    const invoice = await manager.findOneOrFail(ReturnInvoice, {
      where: { id: invoiceId },
    });

    for (const line of lines) {
      const row = await manager.findOne(VariantLocation, {
        where: { variantId: line.variantId, locationId: invoice.locationId },
      });
      if (!row || row.quantity < line.quantity) {
        const variant = await manager.findOne(ProductVariant, {
          where: { id: line.variantId },
        });
        throw new BadRequestException(
          `${this.t('return_invoices.insufficient_stock')} (${variant?.sku ?? line.variantId})`,
        );
      }
      await manager.update(VariantLocation, row.id, {
        quantity: row.quantity - line.quantity,
      });
    }

    invoice.status = ReturnInvoiceStatus.CONFIRMED;
    invoice.confirmedAt = new Date();
    invoice.returnNumber = await this.nextReturnNumber(manager);
    return manager.save(invoice);
  }

  private async nextReturnNumber(manager: EntityManager): Promise<string> {
    const today = new Date();
    const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const todaysCount = await manager
      .createQueryBuilder(ReturnInvoice, 'invoice')
      .where('invoice.returnNumber LIKE :prefix', { prefix: `R${datePart}-%` })
      .getCount();
    return `R${datePart}-${todaysCount + 1}`;
  }
}
