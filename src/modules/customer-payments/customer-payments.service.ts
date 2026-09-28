import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { CustomerPayment } from './customer-payment.entity';
import { CreateCustomerPaymentDto } from './dto/create-customer-payment.dto';
import { QueryCustomerPaymentsDto } from './dto/query-customer-payments.dto';
import { Customer } from '../customers/customer.entity';
import type { RequestUser } from '../../common/types/authenticated-request';

@Injectable()
export class CustomerPaymentsService {
  constructor(
    @InjectRepository(CustomerPayment)
    private readonly paymentRepository: Repository<CustomerPayment>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  async findAll(query: QueryCustomerPaymentsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoinAndSelect('payment.customer', 'customer')
      .leftJoinAndSelect('payment.paymentMethod', 'paymentMethod')
      .orderBy('payment.paymentDate', 'DESC')
      .addOrderBy('payment.createdAt', 'DESC');
    if (query.customerId) {
      qb.andWhere('payment.customerId = :customerId', {
        customerId: query.customerId,
      });
    }

    const [payments, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: payments.map((payment) => ({
        id: payment.id,
        customerId: payment.customerId,
        customerName: payment.customer!.name,
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

  async create(dto: CreateCustomerPaymentDto, user: RequestUser): Promise<CustomerPayment> {
    if (!(await this.customerRepository.exists({ where: { id: dto.customerId } }))) {
      throw new BadRequestException(this.t('customer_payments.customer_not_found'));
    }
    const payment = this.paymentRepository.create({
      customerId: dto.customerId,
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
      throw new NotFoundException(this.t('customer_payments.not_found'));
    }
  }
}
