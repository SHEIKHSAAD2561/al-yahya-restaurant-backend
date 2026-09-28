import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Supplier } from './supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PurchaseInvoice } from '../purchase-invoices/entities/purchase-invoice.entity';
import { PurchaseInvoiceStatus } from '../purchase-invoices/purchase-invoice-status.enum';
import { ReturnInvoice } from '../return-invoices/entities/return-invoice.entity';
import { ReturnInvoiceStatus } from '../return-invoices/return-invoice-status.enum';
import { SupplierPayment } from '../supplier-payments/supplier-payment.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(PurchaseInvoice)
    private readonly purchaseInvoiceRepository: Repository<PurchaseInvoice>,
    @InjectRepository(ReturnInvoice)
    private readonly returnInvoiceRepository: Repository<ReturnInvoice>,
    @InjectRepository(SupplierPayment)
    private readonly paymentRepository: Repository<SupplierPayment>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  /** `Σconfirmed purchase invoices − Σconfirmed returns − Σpayments` — how
   * much this restaurant still owes the supplier. Derived on read, not
   * stored, same "derive, don't duplicate" approach as `Customer.totalPaid`. */
  private async balance(supplierId: string): Promise<number> {
    const [purchased, returned, paid] = await Promise.all([
      this.purchaseInvoiceRepository
        .createQueryBuilder('invoice')
        .select('COALESCE(SUM(invoice.total), 0)', 'total')
        .where('invoice.supplierId = :supplierId', { supplierId })
        .andWhere('invoice.status = :status', {
          status: PurchaseInvoiceStatus.CONFIRMED,
        })
        .getRawOne<{ total: string }>(),
      this.returnInvoiceRepository
        .createQueryBuilder('invoice')
        .select('COALESCE(SUM(invoice.total), 0)', 'total')
        .where('invoice.supplierId = :supplierId', { supplierId })
        .andWhere('invoice.status = :status', {
          status: ReturnInvoiceStatus.CONFIRMED,
        })
        .getRawOne<{ total: string }>(),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'total')
        .where('payment.supplierId = :supplierId', { supplierId })
        .getRawOne<{ total: string }>(),
    ]);
    return (
      Number(purchased?.total ?? 0) -
      Number(returned?.total ?? 0) -
      Number(paid?.total ?? 0)
    );
  }

  async findAll(includeInactive = false) {
    const suppliers = await this.supplierRepository.find({
      where: includeInactive ? {} : { isActive: true },
      order: { name: 'ASC' },
    });
    return Promise.all(
      suppliers.map(async (supplier) => ({
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        vatNumber: supplier.vatNumber,
        address: supplier.address,
        isActive: supplier.isActive,
        balance: await this.balance(supplier.id),
      })),
    );
  }

  async findOneOrFail(id: string) {
    const supplier = await this.supplierRepository.findOne({ where: { id } });
    if (!supplier) {
      throw new NotFoundException(this.t('suppliers.not_found'));
    }
    return { ...supplier, balance: await this.balance(id) };
  }

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const supplier = this.supplierRepository.create({
      name: dto.name.trim(),
      phone: dto.phone?.trim() || null,
      email: dto.email?.trim() || null,
      vatNumber: dto.vatNumber?.trim() || null,
      address: dto.address?.trim() || null,
      notes: dto.notes?.trim() || null,
    });
    return this.supplierRepository.save(supplier);
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({ where: { id } });
    if (!supplier) {
      throw new NotFoundException(this.t('suppliers.not_found'));
    }
    if (dto.name !== undefined) supplier.name = dto.name.trim();
    if (dto.phone !== undefined) supplier.phone = dto.phone?.trim() || null;
    if (dto.email !== undefined) supplier.email = dto.email?.trim() || null;
    if (dto.vatNumber !== undefined)
      supplier.vatNumber = dto.vatNumber?.trim() || null;
    if (dto.address !== undefined)
      supplier.address = dto.address?.trim() || null;
    if (dto.notes !== undefined) supplier.notes = dto.notes?.trim() || null;
    if (dto.isActive !== undefined) supplier.isActive = dto.isActive;
    return this.supplierRepository.save(supplier);
  }

  /** No hard delete — a supplier referenced by purchase history must stay
   * addressable (every `PurchaseInvoice`/`ReturnInvoice`/`SupplierPayment`
   * row RESTRICTs the FK). "Delete" from the UI just deactivates, same
   * pattern as `Location.isActive`. */
  async deactivate(id: string): Promise<Supplier> {
    return this.update(id, { isActive: false });
  }
}
