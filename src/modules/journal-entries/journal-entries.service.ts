import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalEntryLine } from './entities/journal-entry-line.entity';
import { JournalEntryStatus } from './journal-entry-status.enum';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { QueryJournalEntriesDto } from './dto/query-journal-entries.dto';
import { JournalEntryLineDto } from './dto/journal-entry-line.dto';
import { Account } from '../chart-of-accounts/account.entity';
import type { RequestUser } from '../../common/types/authenticated-request';

export interface SystemJournalEntryLine {
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
}

@Injectable()
export class JournalEntriesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(JournalEntry)
    private readonly entryRepository: Repository<JournalEntry>,
    @InjectRepository(JournalEntryLine)
    private readonly lineRepository: Repository<JournalEntryLine>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  async findAll(query: QueryJournalEntriesDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const qb = this.entryRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.lines', 'line')
      .orderBy('entry.entryDate', 'DESC')
      .addOrderBy('entry.createdAt', 'DESC');
    if (query.status)
      qb.andWhere('entry.status = :status', { status: query.status });
    if (query.dateFrom)
      qb.andWhere('entry.entryDate >= :dateFrom', { dateFrom: query.dateFrom });
    if (query.dateTo)
      qb.andWhere('entry.entryDate <= :dateTo', { dateTo: query.dateTo });
    if (query.accountId) {
      qb.andWhere(
        'entry.id IN (SELECT journalEntryId FROM journal_entry_lines WHERE accountId = :accountId)',
        {
          accountId: query.accountId,
        },
      );
    }

    const [entries, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: entries.map((entry) => ({
        id: entry.id,
        entryNumber: entry.entryNumber,
        entryDate: entry.entryDate,
        memo: entry.memo,
        status: entry.status,
        reversalOfEntryId: entry.reversalOfEntryId,
        totalDebit: entry.lines.reduce(
          (sum, line) => sum + Number(line.debit),
          0,
        ),
        lineCount: entry.lines.length,
        createdAt: entry.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOneOrFail(id: string): Promise<JournalEntry> {
    const entry = await this.entryRepository.findOne({
      where: { id },
      relations: { lines: { account: true } },
    });
    if (!entry) {
      throw new NotFoundException(this.t('journal_entries.not_found'));
    }
    return entry;
  }

  private validateLines(lines: JournalEntryLineDto[]): void {
    for (const line of lines) {
      const hasDebit = line.debit > 0;
      const hasCredit = line.credit > 0;
      if (hasDebit === hasCredit) {
        throw new BadRequestException(
          this.t('journal_entries.line_needs_one_side'),
        );
      }
    }
  }

  private async assertAccountsUsable(accountIds: string[]): Promise<void> {
    const accounts = await this.accountRepository.find({
      where: { id: In(accountIds) },
    });
    if (accounts.length !== new Set(accountIds).size) {
      throw new BadRequestException(this.t('chart_of_accounts.not_found'));
    }
    if (accounts.some((account) => !account.isActive)) {
      throw new BadRequestException(this.t('journal_entries.account_inactive'));
    }
  }

  private buildLineEntities(
    journalEntryId: string,
    lines: JournalEntryLineDto[],
  ): JournalEntryLine[] {
    return lines.map((line) =>
      this.lineRepository.create({
        journalEntryId,
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        description: line.description?.trim() || null,
      }),
    );
  }

  async create(
    dto: CreateJournalEntryDto,
    user: RequestUser,
  ): Promise<JournalEntry> {
    this.validateLines(dto.lines);
    await this.assertAccountsUsable(dto.lines.map((line) => line.accountId));

    return this.dataSource.transaction(async (manager) => {
      const entry = manager.create(JournalEntry, {
        entryDate: dto.entryDate,
        memo: dto.memo?.trim() || null,
        status: JournalEntryStatus.DRAFT,
        createdByUserId: user.id,
      });
      const saved = await manager.save(entry);
      await manager.save(this.buildLineEntities(saved.id, dto.lines));
      return manager.findOneOrFail(JournalEntry, {
        where: { id: saved.id },
        relations: { lines: true },
      });
    });
  }

  async update(id: string, dto: UpdateJournalEntryDto): Promise<JournalEntry> {
    const entry = await this.entryRepository.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException(this.t('journal_entries.not_found'));
    }
    if (entry.status !== JournalEntryStatus.DRAFT) {
      throw new BadRequestException(this.t('journal_entries.not_editable'));
    }

    return this.dataSource.transaction(async (manager) => {
      if (dto.entryDate !== undefined) entry.entryDate = dto.entryDate;
      if (dto.memo !== undefined) entry.memo = dto.memo.trim() || null;

      if (dto.lines !== undefined) {
        this.validateLines(dto.lines);
        await this.assertAccountsUsable(
          dto.lines.map((line) => line.accountId),
        );
        await manager.delete(JournalEntryLine, { journalEntryId: id });
        await manager.save(this.buildLineEntities(id, dto.lines));
      }
      await manager.save(entry);
      return manager.findOneOrFail(JournalEntry, {
        where: { id },
        relations: { lines: { account: true } },
      });
    });
  }

  async remove(id: string): Promise<void> {
    const entry = await this.entryRepository.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException(this.t('journal_entries.not_found'));
    }
    if (entry.status !== JournalEntryStatus.DRAFT) {
      throw new BadRequestException(this.t('journal_entries.not_editable'));
    }
    await this.entryRepository.delete(id);
  }

  /** Assigns `entryNumber` and marks `POSTED` — permanent, same "confirm
   * can't be undone" rule as every DRAFT/CONFIRMED lifecycle in this
   * codebase. Validates Σdebit === Σcredit one last time (lines may have
   * been edited since creation). */
  async post(id: string): Promise<JournalEntry> {
    const entry = await this.entryRepository.findOne({
      where: { id },
      relations: { lines: true },
    });
    if (!entry) {
      throw new NotFoundException(this.t('journal_entries.not_found'));
    }
    if (entry.status !== JournalEntryStatus.DRAFT) {
      throw new BadRequestException(this.t('journal_entries.already_posted'));
    }
    this.assertBalanced(entry.lines);

    return this.dataSource.transaction(async (manager) => {
      entry.status = JournalEntryStatus.POSTED;
      entry.postedAt = new Date();
      entry.entryNumber = await this.nextEntryNumber(manager);
      return manager.save(entry);
    });
  }

  private assertBalanced(lines: { debit: number; credit: number }[]): void {
    const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit), 0);
    const totalCredit = lines.reduce(
      (sum, line) => sum + Number(line.credit),
      0,
    );
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(this.t('journal_entries.not_balanced'));
    }
  }

  /** Creates a brand-new, immediately-`POSTED` entry with every line's
   * debit/credit swapped — the original entry is never touched. Rejects
   * reversing an entry that's already been reversed once (one reversal per
   * entry, matching the "undo via a counter-transaction, not a chain of
   * them" scope this was built to). */
  async reverse(id: string, user: RequestUser): Promise<JournalEntry> {
    const entry = await this.entryRepository.findOne({
      where: { id },
      relations: { lines: true },
    });
    if (!entry) {
      throw new NotFoundException(this.t('journal_entries.not_found'));
    }
    if (entry.status !== JournalEntryStatus.POSTED) {
      throw new BadRequestException(this.t('journal_entries.not_posted'));
    }
    if (
      await this.entryRepository.exists({ where: { reversalOfEntryId: id } })
    ) {
      throw new BadRequestException(this.t('journal_entries.already_reversed'));
    }

    return this.dataSource.transaction(async (manager) => {
      const reversal = manager.create(JournalEntry, {
        entryDate: new Date().toISOString().slice(0, 10),
        memo: `Reversal of ${entry.entryNumber}`,
        status: JournalEntryStatus.POSTED,
        createdByUserId: user.id,
        postedAt: new Date(),
        reversalOfEntryId: entry.id,
        entryNumber: await this.nextEntryNumber(manager),
      });
      const saved = await manager.save(reversal);
      await manager.save(
        entry.lines.map((line) =>
          manager.create(JournalEntryLine, {
            journalEntryId: saved.id,
            accountId: line.accountId,
            debit: line.credit,
            credit: line.debit,
            description: line.description,
          }),
        ),
      );
      return manager.findOneOrFail(JournalEntry, {
        where: { id: saved.id },
        relations: { lines: { account: true } },
      });
    });
  }

  /** For other modules (Fixed Assets' depreciation) to post a system-generated
   * entry directly, skipping the DRAFT step — the caller has already fully
   * computed and validated the lines, there's nothing left to draft. */
  async postSystemEntry(
    manager: EntityManager,
    input: { entryDate: string; memo: string; lines: SystemJournalEntryLine[] },
    user: RequestUser,
  ): Promise<JournalEntry> {
    this.assertBalanced(input.lines);
    const entry = manager.create(JournalEntry, {
      entryDate: input.entryDate,
      memo: input.memo,
      status: JournalEntryStatus.POSTED,
      createdByUserId: user.id,
      postedAt: new Date(),
      entryNumber: await this.nextEntryNumber(manager),
    });
    const saved = await manager.save(entry);
    await manager.save(
      input.lines.map((line) =>
        manager.create(JournalEntryLine, {
          journalEntryId: saved.id,
          accountId: line.accountId,
          debit: line.debit,
          credit: line.credit,
          description: line.description ?? null,
        }),
      ),
    );
    return saved;
  }

  /** "JE{YYYYMMDD}-{n}", same same-day counting approach as
   * `PurchaseInvoicesService.nextInvoiceNumber()`. */
  private async nextEntryNumber(manager: EntityManager): Promise<string> {
    const today = new Date();
    const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const todaysCount = await manager
      .createQueryBuilder(JournalEntry, 'entry')
      .where('entry.entryNumber LIKE :prefix', { prefix: `JE${datePart}-%` })
      .getCount();
    return `JE${datePart}-${todaysCount + 1}`;
  }
}
