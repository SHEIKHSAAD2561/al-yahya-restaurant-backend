import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Expense } from './expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpensesDto } from './dto/query-expenses.dto';
import type { RequestUser } from '../../common/types/authenticated-request';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  private buildExpensesQuery(query: QueryExpensesDto) {
    const qb = this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.location', 'location')
      .leftJoinAndSelect('expense.createdBy', 'createdBy');

    if (query.dateFrom || query.dateTo) {
      qb.andWhere('expense.expenseDate BETWEEN :from AND :to', {
        from: query.dateFrom ?? '1900-01-01',
        to: query.dateTo ?? '9999-12-31',
      });
    }
    if (query.category) {
      qb.andWhere('expense.category = :category', { category: query.category });
    }
    if (query.locationId) {
      qb.andWhere('expense.locationId = :locationId', {
        locationId: query.locationId,
      });
    }
    return qb
      .orderBy('expense.expenseDate', 'DESC')
      .addOrderBy('expense.createdAt', 'DESC');
  }

  private toListItem(expense: Expense) {
    return {
      id: expense.id,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      locationId: expense.locationId,
      locationName: expense.location?.name ?? null,
      expenseDate: expense.expenseDate,
      createdByName: expense.createdBy?.nameEn ?? '',
      createdAt: expense.createdAt,
    };
  }

  async findAll(query: QueryExpensesDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const [expenses, total] = await this.buildExpensesQuery(query)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: expenses.map((expense) => this.toListItem(expense)),
      total,
      page,
      pageSize,
    };
  }

  async findOneOrFail(id: string) {
    const expense = await this.expenseRepository.findOne({
      where: { id },
      relations: { location: true, createdBy: true },
    });
    if (!expense) {
      throw new NotFoundException(this.t('expenses.not_found'));
    }
    return this.toListItem(expense);
  }

  async create(dto: CreateExpenseDto, user: RequestUser): Promise<Expense> {
    const expense = this.expenseRepository.create({
      category: dto.category,
      description: dto.description.trim(),
      amount: dto.amount,
      locationId: dto.locationId ?? null,
      expenseDate: dto.expenseDate,
      createdByUserId: user.id,
    });
    return this.expenseRepository.save(expense);
  }

  async update(id: string, dto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({ where: { id } });
    if (!expense) {
      throw new NotFoundException(this.t('expenses.not_found'));
    }
    if (dto.category !== undefined) expense.category = dto.category;
    if (dto.description !== undefined)
      expense.description = dto.description.trim();
    if (dto.amount !== undefined) expense.amount = dto.amount;
    if (dto.locationId !== undefined) expense.locationId = dto.locationId;
    if (dto.expenseDate !== undefined) expense.expenseDate = dto.expenseDate;
    return this.expenseRepository.save(expense);
  }

  async remove(id: string): Promise<void> {
    const result = await this.expenseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(this.t('expenses.not_found'));
    }
  }

  /** Sum of expenses in a date range, grouped by category — used by the
   * Dashboard/Reports "Profit & expenses summary" widgets. */
  async summaryByCategory(
    dateFrom: string,
    dateTo: string,
  ): Promise<Record<string, number>> {
    const rows = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('expense.category', 'category')
      .addSelect('SUM(expense.amount)', 'total')
      .where('expense.expenseDate BETWEEN :from AND :to', {
        from: dateFrom,
        to: dateTo,
      })
      .groupBy('expense.category')
      .getRawMany<{ category: string; total: string }>();

    return Object.fromEntries(
      rows.map((row) => [row.category, Number(row.total)]),
    );
  }
}
