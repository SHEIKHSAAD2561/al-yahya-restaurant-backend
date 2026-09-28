import { randomInt } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { toCsv } from '../../common/utils/csv.util';
import { Sale } from '../sales/entities/sale.entity';
import { SaleStatus } from '../sales/sale-enums';
import { CustomerPayment } from '../customer-payments/customer-payment.entity';

const DEFAULT_PAGE_SIZE = 10;
const MAX_EXPORT_ROWS = 5000;

export interface CustomerListItem extends Customer {
  /** Sum of `amountPaid` across this customer's COMPLETED sales — see
   * CustomersService.balances(). */
  totalPaid: number;
  /** Outstanding receivable balance: `Σ(sale.total − sale.amountPaid) for
   * COMPLETED sales − Σcustomer payments`. The per-sale gap is only ever
   * non-zero for a "Pay Later" (`isPostPayment`) checkout — an ordinary sale
   * has `amountPaid === total`, contributing 0. */
  debitAmount: number;
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(CustomerPayment)
    private readonly paymentRepository: Repository<CustomerPayment>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  async findAll(query: QueryCustomersDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

    const qb = this.customerRepository.createQueryBuilder('customer');
    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        new Brackets((where) => {
          where
            .where('customer.name LIKE :search', { search })
            .orWhere('customer.code LIKE :search', { search })
            .orWhere('customer.phone LIKE :search', { search })
            .orWhere('customer.email LIKE :search', { search });
        }),
      );
    }
    qb.orderBy('customer.createdAt', 'DESC');

    const [customers, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: await Promise.all(
        customers.map((customer) => this.toListItem(customer)),
      ),
      total,
      page,
      pageSize,
    };
  }

  /** Narrow, fast lookup for the POS "Add Customer" search — no pagination,
   * capped result count, name/phone/code only (matches that modal's own
   * search hint). */
  async search(term: string): Promise<Customer[]> {
    if (!term.trim()) return [];
    const search = `%${term.trim()}%`;
    return this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.name LIKE :search', { search })
      .orWhere('customer.phone LIKE :search', { search })
      .orWhere('customer.code LIKE :search', { search })
      .orderBy('customer.name', 'ASC')
      .take(20)
      .getMany();
  }

  /** Same columns the list page shows — capped, not paginated, like the
   * products export (see ProductsService.exportCsv). */
  async exportCsv(query: QueryCustomersDto): Promise<string> {
    const qb = this.customerRepository.createQueryBuilder('customer');
    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        new Brackets((where) => {
          where
            .where('customer.name LIKE :search', { search })
            .orWhere('customer.code LIKE :search', { search })
            .orWhere('customer.phone LIKE :search', { search })
            .orWhere('customer.email LIKE :search', { search });
        }),
      );
    }
    const customers = await qb
      .orderBy('customer.createdAt', 'DESC')
      .take(MAX_EXPORT_ROWS)
      .getMany();

    const header = [
      'Customer Code',
      'Customer Name',
      'Customer Email',
      'Phone Number',
    ];
    const rows = customers.map((customer) => [
      customer.code,
      customer.name,
      customer.email ?? '',
      customer.phone,
    ]);
    return '﻿' + toCsv([header, ...rows]);
  }

  async findOneOrFail(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(this.t('customers.not_found'));
    }
    return customer;
  }

  /** Same record as `findOneOrFail()`, plus derived balance — used only by
   * the `GET /customers/:id` route (the customer details page and the
   * Customer Payments "record a payment" flow), not by `update()`/`remove()`
   * internally, which just need the plain entity to mutate/delete. */
  async findOneWithBalance(id: string): Promise<CustomerListItem> {
    return this.toListItem(await this.findOneOrFail(id));
  }

  /** 7-digit numeric code not already in use — same shape as the reference
   * screenshot's example ("4575130"). */
  async generateCode(): Promise<{ code: string }> {
    for (;;) {
      const code = String(randomInt(1_000_000, 10_000_000));
      if (!(await this.customerRepository.exists({ where: { code } }))) {
        return { code };
      }
    }
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    await this.assertCodeAvailable(dto.code);
    const customer = this.customerRepository.create({
      name: dto.name.trim(),
      code: dto.code.trim(),
      phone: dto.phone.trim(),
      ...this.optionalFields(dto),
    });
    return this.customerRepository.save(customer);
  }

  /** Quick-add from the POS "Add Customer" search — name + phone only, code
   * generated automatically. Deliberately not exposed on its own route: it's
   * just `create()` with the code filled in first. */
  async quickCreate(name: string, phone: string): Promise<Customer> {
    const { code } = await this.generateCode();
    return this.create({ name, phone, code });
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOneOrFail(id);
    if (dto.code !== undefined && dto.code.trim() !== customer.code) {
      await this.assertCodeAvailable(dto.code);
    }
    if (dto.name !== undefined) customer.name = dto.name.trim();
    if (dto.code !== undefined) customer.code = dto.code.trim();
    if (dto.phone !== undefined) customer.phone = dto.phone.trim();
    // A PATCH only ever touches the fields it actually sends — an omitted
    // optional field must stay as-is, not be wiped to null.
    Object.assign(customer, this.optionalFields(dto));
    return this.customerRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    await this.findOneOrFail(id);
    await this.customerRepository.delete(id);
  }

  private async toListItem(customer: Customer): Promise<CustomerListItem> {
    const [paidRow, dueRow, settledRow] = await Promise.all([
      this.saleRepository
        .createQueryBuilder('sale')
        .select('COALESCE(SUM(sale.amountPaid), 0)', 'total')
        .where('sale.customerId = :customerId', { customerId: customer.id })
        .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
        .getRawOne<{ total: string }>(),
      this.saleRepository
        .createQueryBuilder('sale')
        .select(
          'COALESCE(SUM(sale.total - COALESCE(sale.amountPaid, 0)), 0)',
          'total',
        )
        .where('sale.customerId = :customerId', { customerId: customer.id })
        .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
        .getRawOne<{ total: string }>(),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'total')
        .where('payment.customerId = :customerId', { customerId: customer.id })
        .getRawOne<{ total: string }>(),
    ]);
    return {
      ...customer,
      totalPaid: Number(paidRow?.total ?? 0),
      debitAmount: Number(dueRow?.total ?? 0) - Number(settledRow?.total ?? 0),
    };
  }

  /** One pair of aggregate queries across every customer — backs the
   * Customer Payments page's "Total Outstanding" card without fetching the
   * (potentially large, paginated) customer list in full, unlike Suppliers'
   * equivalent card which sums an already-fetched full supplier list. */
  async receivablesSummary(): Promise<{ totalOutstanding: number }> {
    const [dueRow, settledRow] = await Promise.all([
      this.saleRepository
        .createQueryBuilder('sale')
        .select(
          'COALESCE(SUM(sale.total - COALESCE(sale.amountPaid, 0)), 0)',
          'total',
        )
        .where('sale.status = :status', { status: SaleStatus.COMPLETED })
        .getRawOne<{ total: string }>(),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'total')
        .getRawOne<{ total: string }>(),
    ]);
    return {
      totalOutstanding:
        Number(dueRow?.total ?? 0) - Number(settledRow?.total ?? 0),
    };
  }

  /**
   * Every optional field, included only when the caller actually sent it —
   * critical for `update()`: an omitted field on a PATCH must be left alone,
   * not reset to null (a naïve `dto.field ?? null` on every key would wipe
   * out, say, email whenever a PATCH only touches `name`).
   */
  private optionalFields(dto: UpdateCustomerDto) {
    const fields: Partial<Customer> = {};
    if (dto.email !== undefined) fields.email = dto.email.trim() || null;
    if (dto.gender !== undefined) fields.gender = dto.gender;
    if (dto.birthday !== undefined) fields.birthday = dto.birthday;
    if (dto.vatNumber !== undefined) fields.vatNumber = dto.vatNumber || null;
    if (dto.commercialRegisterNumber !== undefined) {
      fields.commercialRegisterNumber =
        dto.commercialRegisterNumber.trim() || null;
    }
    if (dto.nationalId !== undefined)
      fields.nationalId = dto.nationalId.trim() || null;
    if (dto.country !== undefined) fields.country = dto.country.trim() || null;
    if (dto.city !== undefined) fields.city = dto.city.trim() || null;
    if (dto.district !== undefined)
      fields.district = dto.district.trim() || null;
    if (dto.street !== undefined) fields.street = dto.street.trim() || null;
    if (dto.buildingNumber !== undefined)
      fields.buildingNumber = dto.buildingNumber.trim() || null;
    if (dto.additionalNumber !== undefined)
      fields.additionalNumber = dto.additionalNumber.trim() || null;
    if (dto.postalCode !== undefined)
      fields.postalCode = dto.postalCode.trim() || null;
    if (dto.notes !== undefined) fields.notes = dto.notes.trim() || null;
    return fields;
  }

  private async assertCodeAvailable(code: string): Promise<void> {
    if (
      await this.customerRepository.exists({ where: { code: code.trim() } })
    ) {
      throw new ConflictException(this.t('customers.code_taken'));
    }
  }
}
