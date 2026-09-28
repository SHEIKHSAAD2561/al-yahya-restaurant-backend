import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { SaleLine } from '../sales/entities/sale-line.entity';
import { SaleStatus } from '../sales/sale-enums';
import { VariantLocation } from '../products/entities/variant-location.entity';
import { ProductType } from '../products/product-type.enum';
import { ExpensesService } from '../expenses/expenses.service';
import { QueryReportsDto } from './dto/query-reports.dto';

const TOP_N = 10;
const LOW_STOCK_LIMIT = 20;

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
function daysAgo(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - days);
  return copy;
}
function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
/** `DATE(...)` raw-query results come back as a `Date` (mysql2's default,
 * `dateStrings` isn't set) in local server time, not UTC — going through
 * `toISOString()` here would shift across a timezone boundary. Every other
 * value in this map is already a plain `YYYY-MM-DD` string. */
function normalizeDateKey(value: unknown): string {
  if (value instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  return String(value).slice(0, 10);
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleLine)
    private readonly saleLineRepository: Repository<SaleLine>,
    @InjectRepository(VariantLocation)
    private readonly variantLocationRepository: Repository<VariantLocation>,
    private readonly expensesService: ExpensesService,
  ) {}

  async getReport(query: QueryReportsDto) {
    const days = query.days ?? 30;
    const now = new Date();
    const from = startOfDay(daysAgo(now, days - 1));

    const [
      stats,
      salesVsProfit,
      salesByCategory,
      salesByPaymentMethod,
      branchSales,
      profitExpensesSummary,
      bestSellingProducts,
      inventoryValuation,
      itemsBelowMinimum,
    ] = await Promise.all([
      this.loadStats(query.locationId, from, now),
      this.loadSalesVsProfit(query.locationId, from, now),
      this.loadSalesByCategory(query.locationId, from, now),
      this.loadSalesByPaymentMethod(query.locationId, from, now),
      this.loadBranchSales(query.locationId, from, now),
      this.loadProfitExpensesSummary(query.locationId, from, now),
      this.loadBestSellingProducts(query.locationId, from, now),
      this.loadInventoryValuation(query.locationId),
      this.loadItemsBelowMinimum(query.locationId),
    ]);

    return {
      days,
      stats,
      salesVsProfit,
      salesByCategory,
      salesByPaymentMethod,
      branchSales,
      profitExpensesSummary,
      bestSellingProducts,
      inventoryValuation,
      itemsBelowMinimum,
    };
  }

  private baseSalesQuery(locationId: string | undefined, from: Date, to: Date) {
    const qb = this.saleRepository
      .createQueryBuilder('sale')
      .innerJoin('sale.register', 'register')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('sale.completedAt BETWEEN :from AND :to', { from, to });
    if (locationId)
      qb.andWhere('register.locationId = :locationId', { locationId });
    return qb;
  }

  private baseLineQuery(locationId: string | undefined, from: Date, to: Date) {
    const qb = this.saleLineRepository
      .createQueryBuilder('line')
      .innerJoin('line.sale', 'sale')
      .innerJoin('sale.register', 'register')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('sale.completedAt BETWEEN :from AND :to', { from, to });
    if (locationId)
      qb.andWhere('register.locationId = :locationId', { locationId });
    return qb;
  }

  private async loadStats(
    locationId: string | undefined,
    from: Date,
    to: Date,
  ) {
    const salesRow = await this.baseSalesQuery(locationId, from, to)
      .select('COALESCE(SUM(sale.total), 0)', 'revenue')
      .addSelect('COALESCE(SUM(sale.taxAmount), 0)', 'vat')
      .addSelect('COUNT(*)', 'invoiceCount')
      .getRawOne<{ revenue: string; vat: string; invoiceCount: string }>();

    const profitRow = await this.baseLineQuery(locationId, from, to)
      .select(
        'COALESCE(SUM(line.lineSubtotal - line.unitCost * line.quantity), 0)',
        'grossProfit',
      )
      .getRawOne<{ grossProfit: string }>();

    const revenue = Number(salesRow?.revenue ?? 0);
    const grossProfit = Number(profitRow?.grossProfit ?? 0);
    const invoiceCount = Number(salesRow?.invoiceCount ?? 0);

    return {
      revenue,
      grossProfit,
      profitMargin:
        revenue > 0 ? Math.round((grossProfit / revenue) * 1000) / 10 : 0,
      vat: Number(salesRow?.vat ?? 0),
      invoiceCount,
      averageInvoice:
        invoiceCount > 0 ? Math.round((revenue / invoiceCount) * 100) / 100 : 0,
    };
  }

  private async loadSalesVsProfit(
    locationId: string | undefined,
    from: Date,
    to: Date,
  ) {
    const salesRows = await this.baseSalesQuery(locationId, from, to)
      .select('DATE(sale.completedAt)', 'date')
      .addSelect('COALESCE(SUM(sale.total), 0)', 'sales')
      .groupBy('DATE(sale.completedAt)')
      .getRawMany<{ date: string; sales: string }>();
    const profitRows = await this.baseLineQuery(locationId, from, to)
      .select('DATE(sale.completedAt)', 'date')
      .addSelect(
        'COALESCE(SUM(line.lineSubtotal - line.unitCost * line.quantity), 0)',
        'profit',
      )
      .groupBy('DATE(sale.completedAt)')
      .getRawMany<{ date: string; profit: string }>();

    const profitByDate = new Map(
      profitRows.map((row) => [normalizeDateKey(row.date), Number(row.profit)]),
    );
    const salesByDate = new Map(
      salesRows.map((row) => [normalizeDateKey(row.date), Number(row.sales)]),
    );

    // Always return one point per day in the range, even with no sales that
    // day, so the chart's x-axis is a continuous timeline, not just the days
    // something happened to sell.
    const points: { date: string; sales: number; profit: number }[] = [];
    for (
      let cursor = new Date(from);
      cursor <= to;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const key = toDateOnly(cursor);
      points.push({
        date: key,
        sales: salesByDate.get(key) ?? 0,
        profit: profitByDate.get(key) ?? 0,
      });
    }
    return points;
  }

  private async loadSalesByCategory(
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
      .orderBy('total', 'DESC');
    if (locationId)
      qb.andWhere('register.locationId = :locationId', { locationId });
    const rows = await qb.getRawMany<{ name: string; total: string }>();
    return rows.map((row) => ({ name: row.name, total: Number(row.total) }));
  }

  private async loadSalesByPaymentMethod(
    locationId: string | undefined,
    from: Date,
    to: Date,
  ) {
    const rows = await this.baseSalesQuery(locationId, from, to)
      .innerJoin('sale.paymentMethod', 'paymentMethod')
      .select('paymentMethod.name', 'name')
      .addSelect('COALESCE(SUM(sale.amountPaid), 0)', 'total')
      .groupBy('paymentMethod.name')
      .orderBy('total', 'DESC')
      .getRawMany<{ name: string; total: string }>();
    return rows.map((row) => ({ name: row.name, total: Number(row.total) }));
  }

  private async loadBranchSales(
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

  private async loadProfitExpensesSummary(
    locationId: string | undefined,
    from: Date,
    to: Date,
  ) {
    const profitRow = await this.baseLineQuery(locationId, from, to)
      .select(
        'COALESCE(SUM(line.lineSubtotal - line.unitCost * line.quantity), 0)',
        'grossProfit',
      )
      .getRawOne<{ grossProfit: string }>();
    const grossProfit = Number(profitRow?.grossProfit ?? 0);

    const expensesByCategory = await this.expensesService.summaryByCategory(
      toDateOnly(from),
      toDateOnly(to),
    );
    const totalExpenses = Object.values(expensesByCategory).reduce(
      (sum, value) => sum + value,
      0,
    );

    return {
      grossProfit,
      totalExpenses,
      netIncome: grossProfit - totalExpenses,
      expensesByCategory,
    };
  }

  private async loadBestSellingProducts(
    locationId: string | undefined,
    from: Date,
    to: Date,
  ) {
    const qb = this.saleLineRepository
      .createQueryBuilder('line')
      .innerJoin('line.sale', 'sale')
      .innerJoin('sale.register', 'register')
      .select('line.productName', 'name')
      .addSelect('COALESCE(SUM(line.quantity), 0)', 'qtySold')
      .addSelect('COALESCE(SUM(line.lineTotal), 0)', 'revenue')
      .addSelect(
        'COALESCE(SUM(line.lineSubtotal - line.unitCost * line.quantity), 0)',
        'profit',
      )
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('sale.completedAt BETWEEN :from AND :to', { from, to })
      .groupBy('line.productName')
      .orderBy('qtySold', 'DESC')
      .limit(TOP_N);
    if (locationId)
      qb.andWhere('register.locationId = :locationId', { locationId });
    const rows = await qb.getRawMany<{
      name: string;
      qtySold: string;
      revenue: string;
      profit: string;
    }>();
    return rows.map((row) => ({
      name: row.name,
      qtySold: Number(row.qtySold),
      revenue: Number(row.revenue),
      profit: Number(row.profit),
    }));
  }

  private async loadInventoryValuation(
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

  private async loadItemsBelowMinimum(locationId: string | undefined) {
    const qb = this.variantLocationRepository
      .createQueryBuilder('vl')
      .innerJoin('vl.variant', 'variant')
      .innerJoin('variant.product', 'product')
      .select('product.name', 'name')
      .addSelect('variant.sku', 'sku')
      .addSelect('vl.quantity', 'quantity')
      .addSelect('product.reorderPoint', 'reorderPoint')
      .where('product.reorderPoint IS NOT NULL')
      .andWhere('vl.quantity <= product.reorderPoint')
      .andWhere('product.type != :composite', {
        composite: ProductType.COMPOSITE,
      })
      .orderBy('vl.quantity', 'ASC')
      .limit(LOW_STOCK_LIMIT);
    if (locationId) qb.andWhere('vl.locationId = :locationId', { locationId });
    const rows = await qb.getRawMany<{
      name: string;
      sku: string;
      quantity: string;
      reorderPoint: string;
    }>();
    return rows.map((row) => ({
      name: row.name,
      sku: row.sku,
      quantity: Number(row.quantity),
      reorderPoint: Number(row.reorderPoint),
    }));
  }
}
