import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../chart-of-accounts/account.entity';
import { AccountType, normalBalanceFor } from '../chart-of-accounts/account-type.enum';
import { JournalEntryLine } from '../journal-entries/entities/journal-entry-line.entity';
import { JournalEntryStatus } from '../journal-entries/journal-entry-status.enum';
import { AsOfDto, DateRangeDto, GeneralLedgerQueryDto } from './dto/report-period.dto';

export interface TrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  type: AccountType;
  totalDebit: number;
  totalCredit: number;
  /** Positive in the account's own normal-balance column, 0 in the other —
   * a real trial balance never nets debit against credit into one signed
   * number. */
  debitBalance: number;
  creditBalance: number;
}

@Injectable()
export class FinancialReportsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(JournalEntryLine)
    private readonly lineRepository: Repository<JournalEntryLine>,
  ) {}

  /** Every report here only ever looks at `POSTED` journal entries — a
   * `DRAFT` entry is invisible to every balance/report in this codebase,
   * same "not real until confirmed" rule as everywhere else. */
  private postedLinesQuery(dateTo?: string) {
    const qb = this.lineRepository
      .createQueryBuilder('line')
      .innerJoin('line.journalEntry', 'entry')
      .where('entry.status = :status', { status: JournalEntryStatus.POSTED });
    if (dateTo) qb.andWhere('entry.entryDate <= :dateTo', { dateTo });
    return qb;
  }

  async trialBalance(dto: AsOfDto): Promise<{ rows: TrialBalanceRow[]; totalDebit: number; totalCredit: number }> {
    const accounts = await this.accountRepository.find({ order: { code: 'ASC' } });
    const sums = await this.postedLinesQuery(dto.asOf)
      .select('line.accountId', 'accountId')
      .addSelect('COALESCE(SUM(line.debit), 0)', 'totalDebit')
      .addSelect('COALESCE(SUM(line.credit), 0)', 'totalCredit')
      .groupBy('line.accountId')
      .getRawMany<{ accountId: string; totalDebit: string; totalCredit: string }>();
    const sumsByAccount = new Map(sums.map((row) => [row.accountId, row]));

    const rows: TrialBalanceRow[] = accounts
      .map((account) => {
        const sum = sumsByAccount.get(account.id);
        const totalDebit = Number(sum?.totalDebit ?? 0);
        const totalCredit = Number(sum?.totalCredit ?? 0);
        // A trial balance places the net into whichever column it's
        // actually on, regardless of the account's "normal" side — a
        // REVENUE account with a debit net (e.g. from a refund) still shows
        // in the debit column, not forced into credit.
        const net = totalDebit - totalCredit;
        return {
          accountId: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
          totalDebit,
          totalCredit,
          debitBalance: net > 0 ? net : 0,
          creditBalance: net < 0 ? -net : 0,
        };
      })
      .filter((row) => row.totalDebit !== 0 || row.totalCredit !== 0);

    return {
      rows,
      totalDebit: rows.reduce((sum, row) => sum + row.debitBalance, 0),
      totalCredit: rows.reduce((sum, row) => sum + row.creditBalance, 0),
    };
  }

  async generalLedger(query: GeneralLedgerQueryDto) {
    const account = await this.accountRepository.findOneOrFail({ where: { id: query.accountId } });
    const qb = this.postedLinesQuery(query.dateTo)
      .innerJoinAndSelect('line.journalEntry', 'je')
      .andWhere('line.accountId = :accountId', { accountId: query.accountId });
    if (query.dateFrom) qb.andWhere('entry.entryDate >= :dateFrom', { dateFrom: query.dateFrom });
    const lines = await qb.orderBy('je.entryDate', 'ASC').addOrderBy('je.entryNumber', 'ASC').getMany();

    const isDebitNormal = normalBalanceFor(account.type) === 'DEBIT';
    let runningBalance = 0;
    const rows = lines.map((line) => {
      runningBalance += isDebitNormal ? Number(line.debit) - Number(line.credit) : Number(line.credit) - Number(line.debit);
      return {
        journalEntryId: line.journalEntryId,
        entryNumber: line.journalEntry!.entryNumber,
        entryDate: line.journalEntry!.entryDate,
        memo: line.journalEntry!.memo,
        description: line.description,
        debit: Number(line.debit),
        credit: Number(line.credit),
        runningBalance,
      };
    });
    return { account: { id: account.id, code: account.code, name: account.name, type: account.type }, lines: rows };
  }

  /** `Σrevenue credit-normal balances − Σexpense debit-normal balances` for
   * the period. */
  async incomeStatement(dto: DateRangeDto) {
    const revenue = await this.balancesByType(AccountType.REVENUE, dto);
    const expense = await this.balancesByType(AccountType.EXPENSE, dto);
    const totalRevenue = revenue.reduce((sum, row) => sum + row.balance, 0);
    const totalExpense = expense.reduce((sum, row) => sum + row.balance, 0);
    return { revenue, expense, totalRevenue, totalExpense, netIncome: totalRevenue - totalExpense };
  }

  /** Assets vs. Liabilities + Equity, `asOf` a point in time. Since this v1
   * has no formal period-close-to-retained-earnings step, every dollar of
   * revenue/expense ever posted (not just the current period's) is folded
   * into Equity as "Net Income" so the sheet actually balances — flagged
   * here rather than silently guessed. */
  async balanceSheet(dto: AsOfDto) {
    const assets = await this.balancesByType(AccountType.ASSET, { dateTo: dto.asOf });
    const liabilities = await this.balancesByType(AccountType.LIABILITY, { dateTo: dto.asOf });
    const equity = await this.balancesByType(AccountType.EQUITY, { dateTo: dto.asOf });
    const income = await this.incomeStatement({ dateTo: dto.asOf });

    const totalAssets = assets.reduce((sum, row) => sum + row.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, row) => sum + row.balance, 0);
    const totalEquity = equity.reduce((sum, row) => sum + row.balance, 0) + income.netIncome;

    return {
      assets,
      liabilities,
      equity,
      netIncome: income.netIncome,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    };
  }

  private async balancesByType(type: AccountType, dateRange: DateRangeDto) {
    const accounts = await this.accountRepository.find({ where: { type }, order: { code: 'ASC' } });
    const isDebitNormal = normalBalanceFor(type) === 'DEBIT';
    const rows = await Promise.all(
      accounts.map(async (account) => {
        const qb = this.postedLinesQuery(dateRange.dateTo).andWhere('line.accountId = :accountId', {
          accountId: account.id,
        });
        if (dateRange.dateFrom) qb.andWhere('entry.entryDate >= :dateFrom', { dateFrom: dateRange.dateFrom });
        const sum = await qb
          .select('COALESCE(SUM(line.debit), 0)', 'totalDebit')
          .addSelect('COALESCE(SUM(line.credit), 0)', 'totalCredit')
          .getRawOne<{ totalDebit: string; totalCredit: string }>();
        const totalDebit = Number(sum?.totalDebit ?? 0);
        const totalCredit = Number(sum?.totalCredit ?? 0);
        const balance = isDebitNormal ? totalDebit - totalCredit : totalCredit - totalDebit;
        return { accountId: account.id, code: account.code, name: account.name, balance };
      }),
    );
    return rows.filter((row) => row.balance !== 0);
  }
}
