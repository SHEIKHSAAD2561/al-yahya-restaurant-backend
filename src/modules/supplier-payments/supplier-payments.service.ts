import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { SupplierPayment } from './supplier-payment.entity';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { QuerySupplierPaymentsDto } from './dto/query-supplier-payments.dto';
import { Supplier } from '../suppliers/supplier.entity';
import type { RequestUser } from '../../common/types/authenticated-request';

@Injectable()
export class SupplierPaymentsService {
  constructor(
    @InjectRepository(SupplierPayment)
    private readonly paymentRepository: Repository<SupplierPayment>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  async findAll(query: QuerySupplierPaymentsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoinAndSelect('payment.supplier', 'supplier')
      .leftJoinAndSelect('payment.paymentMethod', 'paymentMethod')
      .orderBy('payment.paymentDate', 'DESC')
      .addOrderBy('payment.createdAt', 'DESC');
    if (query.supplierId)
      qb.andWhere('payment.supplierId = :supplierId', {
        supplierId: query.supplierId,
      });

    const [payments, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: payments.map((payment) => ({
        id: payment.id,
        supplierId: payment.supplierId,
        supplierName: payment.supplier!.name,
        amount: payment.amount,
        paymentMethodName: payment.paymentMethod?.name ?? null,
        paymentDate: payment.paymentDate,
        notes: payment.notes,
      })),
      total,
      page,
      pageSize,
    };
  }

  async create(
    dto: CreateSupplierPaymentDto,
    user: RequestUser,
  ): Promise<SupplierPayment> {
    if (
      !(await this.supplierRepository.exists({ where: { id: dto.supplierId } }))
    ) {
      throw new BadRequestException(
        this.t('supplier_payments.supplier_not_found'),
      );
    }
    const payment = this.paymentRepository.create({
      supplierId: dto.supplierId,
      amount: dto.amount,
      paymentMethodId: dto.paymentMethodId ?? null,
      paymentDate: dto.paymentDate,
      notes: dto.notes?.trim() || null,
      createdByUserId: user.id,
    });
    return this.paymentRepository.save(payment);
  }

  async remove(id: string): Promise<void> {
    const result = await this.paymentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(this.t('supplier_payments.not_found'));
    }
  }
}
