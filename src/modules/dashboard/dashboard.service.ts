import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { SaleLine } from '../sales/entities/sale-line.entity';
import { SaleStatus } from '../sales/sale-enums';
import { VariantLocation } from '../products/entities/variant-location.entity';
import { ProductType } from '../products/product-type.enum';
import { Register } from '../registers/entities/register.entity';
import { RegisterSession } from '../registers/entities/register-session.entity';
import { RegisterSessionStatus } from '../registers/register-enums';
import { ExpensesService } from '../expenses/expenses.service';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import type { RequestUser } from '../../common/types/authenticated-request';

const RECENT_DAYS = 30;
const TOP_N = 8;

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function daysAgo(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - days);
  return copy;
}
/** `DATE(...)` raw-query results come back as a `Date` (mysql2's default) in
 * local server time, not UTC — `toISOString()` would shift across a
 * timezone boundary. */
function normalizeDateKey(value: unknown): string {
  if (value instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  return String(value).slice(0, 10);
}
/** `(current - previous) / previous * 100`, or `null` when there's nothing to
 * compare against (avoids a meaningless "+Infinity%"/"-100%" from a zero
 * baseline). */
function trend(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Which sections of the dashboard a caller's permissions unlock — same
 * permission-driven trimming pattern as `ProductViewer`. `dashboard.access`
 * alone (checked by the route guard) gets nothing beyond the shape; each
 * section needs its own finer permission from the catalog. */
interface DashboardViewer {
  canViewFinancials: boolean;
  canViewBreakdowns: boolean;
  canViewInsights: boolean;
  canViewRegisters: boolean;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleLine)
    private readonly saleLineRepository: Repository<SaleLine>,
    @InjectRepository(VariantLocation)
    private readonly variantLocationRepository: Repository<VariantLocation>,
    @InjectRepository(Register)
    private readonly registerRepository: Repository<Register>,
    @InjectRepository(RegisterSession)
    private readonly sessionRepository: Repository<RegisterSession>,
    private readonly expensesService: ExpensesService,
  ) {}

  buildViewer(user: RequestUser): DashboardViewer {
    return {
      canViewFinancials: user.permissionCodes.has(
        'dashboard.view_financial_metrics',
      ),
      canViewBreakdowns: user.permissionCodes.has('dashboard.sales_breakdowns'),
      canViewInsights: user.permissionCodes.has('dashboard.sales_insights'),
      canViewRegisters: user.permissionCodes.has(
        'dashboard.view_register_insights',
      ),
    };
  }

  async getSummary(query: QueryDashboardDto, viewer: DashboardViewer) {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(
      new Date(now.getFullYear(), now.getMonth() - 1, 1),
    );
    const recentStart = startOfDay(daysAgo(now, RECENT_DAYS));

    const [
      financials,
      salesBreakdown,
      latestSales,
      activityLog,
      cashRegisters,
    ] = await Promise.all([
      viewer.canViewFinancials
        ? this.loadFinancials(query.locationId, monthStart, lastMonthStart, now)
        : null,
      viewer.canViewBreakdowns
        ? this.loadSalesBreakdown(query.locationId, recentStart, now)
        : null,
      viewer.canViewInsights ? this.loadLatestSales(query.locationId) : null,
      viewer.canViewInsights ? this.loadActivityLog(query.locationId) : null,
      viewer.canViewRegisters ? this.loadCashRegisters(query.locationId) : null,
    ]);

    return {
      financials,
      salesBreakdown,
      latestSales,
      activityLog,
      cashRegisters,
    };
  }

  // ------------------------------------------------------------ financials

  private async loadFinancials(
    locationId: string | undefined,
    monthStart: Date,
    lastMonthStart: Date,
    now: Date,
  ) {
    const [thisMonth, lastMonth, inventoryValue, amountsCollected] =
      await Promise.all([
        this.salesTotalsBetween(locationId, monthStart, now),
        this.salesTotalsBetween(locationId, lastMonthStart, monthStart),
        this.inventoryValue(locationId),
        this.amountsCollectedBetween(locationId, monthStart, now),
      ]);

    return {
      salesThisMonth: thisMonth.total,
      salesTrend: trend(thisMonth.total, lastMonth.total),
      transactionsThisMonth: thisMonth.count,
      transactionsTrend: trend(thisMonth.count, lastMonth.count),
      grossProfitThisMonth: thisMonth.grossProfit,
      grossProfitTrend: trend(thisMonth.grossProfit, lastMonth.grossProfit),
      inventoryValueToday: inventoryValue,
      amountsCollected,
    };
  }

  private baseSalesQuery(locationId: string | undefined, from: Date, to: Date) {
    const qb = this.saleRepository
      .createQueryBuilder('sale')
      .innerJoin('sale.register', 'register')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('sale.completedAt BETWEEN :from AND :to', { from, to });
    if (locationId) {
      qb.andWhere('register.locationId = :locationId', { locationId });
    }
    return qb;
  }

  private async salesTotalsBetween(
    locationId: string | undefined,
    from: Date,
    to: Date,
  ): Promise<{ total: number; count: number; grossProfit: number }> {
    const totals = await this.baseSalesQuery(locationId, from, to)
      .select('COALESCE(SUM(sale.total), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .getRawOne<{ total: string; count: string }>();

    const profitRow = await this.saleLineRepository
      .createQueryBuilder('line')
      .innerJoin('line.sale', 'sale')
      .innerJoin('sale.register', 'register')
      .select(
        'COALESCE(SUM(line.lineSubtotal - line.unitCost * line.quantity), 0)',
        'grossProfit',
      )
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('sale.completedAt BETWEEN :from AND :to', { from, to })
      .andWhere(locationId ? 'register.locationId = :locationId' : '1=1', {
        locationId,
      })
      .getRawOne<{ grossProfit: string }>();

    return {
      total: Number(totals?.total ?? 0),
      count: Number(totals?.count ?? 0),
      grossProfit: Number(profitRow?.grossProfit ?? 0),
    };
  }

  private async inventoryValue(
    locationId: string | undefined,
  ): Promise<number> {
    const qb = this.variantLocationRepository
      .createQueryBuilder('vl')
      .innerJoin('vl.variant', 'variant')
      .innerJoin('variant.product', 'product')
      .select('COALESCE(SUM(vl.quantity * variant.cost), 0)', 'value')
      .where('product.type != :composite', {
        composite: ProductType.COMPOSITE,
      });
    if (locationId) qb.andWhere('vl.locationId = :locationId', { locationId });
    const row = await qb.getRawOne<{ value: string }>();
    return Number(row?.value ?? 0);
  }

  private async amountsCollectedBetween(
    locationId: string | undefined,
    from: Date,
    to: Date,
  ) {
    const rows = await this.baseSalesQuery(locationId, from, to)
      .innerJoin('sale.paymentMethod', 'paymentMethod')
      .select('paymentMethod.name', 'name')
      .addSelect('COALESCE(SUM(sale.amountPaid), 0)', 'total')
      .groupBy('paymentMethod.name')
      .getRawMany<{ name: string; total: string }>();

    const byMethod = rows.map((row) => ({
      name: row.name,
      total: Number(row.total),
    }));
    return {
      byMethod,
      total: byMethod.reduce((sum, row) => sum + row.total, 0),
    };
  }

  // -------------------------------------------------------- sales breakdown

  private async loadSalesBreakdown(
    locationId: string | undefined,
    from: Date,
    to: Date,
  ) {
    const [period, products, categories, branches, cashiers] =
      await Promise.all([
        this.breakdownByDay(locationId, from, to),
        this.breakdownByProduct(locationId, from, to),
        this.breakdownByCategory(locationId, from, to),
        this.breakdownByBranch(locationId, from, to),
        this.breakdownByCashier(locationId, from, to),
      ]);
    return { period, products, categories, branches, cashiers };
  }

  private async breakdownByDay(
    locationId: string | undefined,
    from: Date,
    to: Date,
  ) {
    const rows = await this.baseSalesQuery(locationId, from, to)
      .select('DATE(sale.completedAt)', 'date')
      .addSelect('COALESCE(SUM(sale.total), 0)', 'total')
      .groupBy('DATE(sale.completedAt)')
      .orderBy('DATE(sale.completedAt)', 'ASC')
      .getRawMany<{ date: unknown; total: string }>();
    return rows.map((row) => ({
      date: normalizeDateKey(row.date),
      total: Number(row.total),
    }));
  }

  private async breakdownByProduct(
    locationId: string | undefined,
    from: Date,
    to: Date,
  ) {
    const qb = this.saleLineRepository
      .createQueryBuilder('line')
      .innerJoin('line.sale', 'sale')
      .innerJoin('sale.register', 'register')
      .select('line.productName', 'name')
      .addSelect('COALESCE(SUM(line.lineTotal), 0)', 'total')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('sale.completedAt BETWEEN :from AND :to', { from, to })
      .groupBy('line.productName')
      .orderBy('total', 'DESC')
      .limit(TOP_N);
    if (locationId)
      qb.andWhere('register.locationId = :locationId', { locationId });
    const rows = await qb.getRawMany<{ name: string; total: string }>();
    return rows.map((row) => ({ name: row.name, total: Number(row.total) }));
  }

  private async breakdownByCategory(
    locationId: string | undefined,
    from: Date,
    to: Date,
  ) {
    const qb = this.saleLineRepository
      .createQueryBuilder('line')
      .innerJoin('line.sale', 'sale')
      .innerJoin('sale.register', 'register')
      .innerJoin('line.variant', 'variant')
      .innerJoin('variant.product', 'product')
      .leftJoin('product.category', 'category')
      .select('COALESCE(category.name, :uncategorized)', 'name')
      .addSelect('COALESCE(SUM(line.lineTotal), 0)', 'total')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('sale.completedAt BETWEEN :from AND :to', { from, to })
      .setParameter('uncategorized', 'Uncategorized')
      .groupBy('category.id')
      .orderBy('total', 'DESC')
      .limit(TOP_N);
    if (locationId)
      qb.andWhere('register.locationId = :locationId', { locationId });
    const rows = await qb.getRawMany<{ name: string; total: string }>();
    return rows.map((row) => ({ name: row.name, total: Number(row.total) }));
  }

  private async breakdownByBranch(
    locationId: string | undefined,
    from: Date,
    to: Date,
  ) {
    const qb = this.saleRepository
      .createQueryBuilder('sale')
      .innerJoin('sale.register', 'register')
      .innerJoin('register.location', 'location')
      .select('location.name', 'name')
      .addSelect('COALESCE(SUM(sale.total), 0)', 'total')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('sale.completedAt BETWEEN :from AND :to', { from, to })
      .groupBy('location.id')
      .orderBy('total', 'DESC');
    if (locationId)
      qb.andWhere('register.locationId = :locationId', { locationId });
    const rows = await qb.getRawMany<{ name: string; total: string }>();
    return rows.map((row) => ({ name: row.name, total: Number(row.total) }));
  }

  private async breakdownByCashier(
    locationId: string | undefined,
    from: Date,
    to: Date,
  ) {
    const qb = this.saleRepository
      .createQueryBuilder('sale')
      .innerJoin('sale.register', 'register')
      .innerJoin('sale.cashier', 'cashier')
      .select('cashier.nameEn', 'name')
      .addSelect('COALESCE(SUM(sale.total), 0)', 'total')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('sale.completedAt BETWEEN :from AND :to', { from, to })
      .groupBy('cashier.id')
      .orderBy('total', 'DESC')
      .limit(TOP_N);
    if (locationId)
      qb.andWhere('register.locationId = :locationId', { locationId });
    const rows = await qb.getRawMany<{ name: string; total: string }>();
    return rows.map((row) => ({ name: row.name, total: Number(row.total) }));
  }

  // ------------------------------------------------------------- insights

  private async loadLatestSales(locationId: string | undefined) {
    const qb = this.saleRepository
      .createQueryBuilder('sale')
      .innerJoin('sale.register', 'register')
      .leftJoinAndSelect('sale.customer', 'customer')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .orderBy('sale.completedAt', 'DESC')
      .limit(6);
    if (locationId)
      qb.andWhere('register.locationId = :locationId', { locationId });
    const sales = await qb.getMany();
    return sales.map((sale) => ({
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      customerName: sale.customer?.name ?? null,
      completedAt: sale.completedAt,
      total: sale.total,
    }));
  }

  private async loadActivityLog(locationId: string | undefined) {
    const salesQb = this.saleRepository
      .createQueryBuilder('sale')
      .innerJoin('sale.register', 'register')
      .leftJoinAndSelect('sale.customer', 'customer')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .orderBy('sale.completedAt', 'DESC')
      .limit(TOP_N);
    if (locationId)
      salesQb.andWhere('register.locationId = :locationId', { locationId });

    const [sales, expensesPage] = await Promise.all([
      salesQb.getMany(),
      this.expensesService.findAll({ locationId, pageSize: TOP_N, page: 1 }),
    ]);

    const saleEvents = sales.map((sale) => ({
      type: 'sale' as const,
      id: sale.id,
      label: `Invoice ${sale.invoiceNumber}`,
      sublabel: sale.customer?.name ?? 'Walk-in customer',
      amount: sale.total,
      at: sale.completedAt!,
    }));
    const expenseEvents = expensesPage.items.map((expense) => ({
      type: 'expense' as const,
      id: expense.id,
      label: expense.category,
      sublabel: expense.description,
      amount: expense.amount,
      at: new Date(expense.createdAt),
    }));

    return [...saleEvents, ...expenseEvents]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, TOP_N);
  }

  // --------------------------------------------------------- cash registers

  private async loadCashRegisters(locationId: string | undefined) {
    const registers = await this.registerRepository.find({
      where: locationId ? { locationId } : {},
      order: { createdAt: 'ASC' },
    });
    if (registers.length === 0) return [];

    const sessions = await this.sessionRepository
      .createQueryBuilder('session')
      .where('session.registerId IN (:...ids)', {
        ids: registers.map((r) => r.id),
      })
      .orderBy('session.openedAt', 'DESC')
      .getMany();
    const latestByRegister = new Map<string, RegisterSession>();
    for (const session of sessions) {
      if (!latestByRegister.has(session.registerId)) {
        latestByRegister.set(session.registerId, session);
      }
    }

    return registers.map((register) => {
      const latest = latestByRegister.get(register.id);
      return {
        id: register.id,
        name: register.name,
        openingAmount: latest?.openingAmount ?? 0,
        status:
          latest?.status === RegisterSessionStatus.OPEN
            ? ('OPEN' as const)
            : ('CLOSED' as const),
      };
    });
  }
}
