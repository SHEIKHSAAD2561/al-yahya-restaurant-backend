import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Account } from './account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { QueryAccountsDto } from './dto/query-accounts.dto';

@Injectable()
export class ChartOfAccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  /** Small, fully-loaded list, like Categories/Suppliers — a restaurant's
   * chart of accounts is a few dozen rows at most, not worth paginating. */
  async findAll(query: QueryAccountsDto): Promise<Account[]> {
    const qb = this.accountRepository.createQueryBuilder('account');
    if (query.type) {
      qb.andWhere('account.type = :type', { type: query.type });
    }
    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        new Brackets((where) => {
          where.where('account.name LIKE :search', { search }).orWhere('account.code LIKE :search', { search });
        }),
      );
    }
    return qb.orderBy('account.code', 'ASC').getMany();
  }

  async findOneOrFail(id: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(this.t('chart_of_accounts.not_found'));
    }
    return account;
  }

  private async assertCodeAvailable(code: string, excludeId?: string): Promise<void> {
    const existing = await this.accountRepository.findOne({ where: { code } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(this.t('chart_of_accounts.code_taken'));
    }
  }

  async create(dto: CreateAccountDto): Promise<Account> {
    await this.assertCodeAvailable(dto.code.trim());
    if (dto.parentId) await this.findOneOrFail(dto.parentId);
    const account = this.accountRepository.create({
      code: dto.code.trim(),
      name: dto.name.trim(),
      type: dto.type,
      parentId: dto.parentId ?? null,
    });
    return this.accountRepository.save(account);
  }

  async update(id: string, dto: UpdateAccountDto): Promise<Account> {
    const account = await this.findOneOrFail(id);
    if (dto.code !== undefined && dto.code.trim() !== account.code) {
      await this.assertCodeAvailable(dto.code.trim(), id);
      account.code = dto.code.trim();
    }
    if (dto.name !== undefined) account.name = dto.name.trim();
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException(this.t('chart_of_accounts.cannot_be_own_parent'));
      }
      if (dto.parentId) await this.findOneOrFail(dto.parentId);
      account.parentId = dto.parentId;
    }
    if (dto.isActive !== undefined) {
      if (account.isSystem && !dto.isActive) {
        throw new BadRequestException(this.t('chart_of_accounts.system_account_locked'));
      }
      account.isActive = dto.isActive;
    }
    return this.accountRepository.save(account);
  }

  async remove(id: string): Promise<void> {
    const account = await this.findOneOrFail(id);
    if (account.isSystem) {
      throw new BadRequestException(this.t('chart_of_accounts.system_account_locked'));
    }
    if (await this.accountRepository.exists({ where: { parentId: id } })) {
      throw new BadRequestException(this.t('chart_of_accounts.has_children'));
    }
    const [{ n }] = await this.accountRepository.manager.query(
      'SELECT COUNT(*) n FROM journal_entry_lines WHERE accountId = ?',
      [id],
    );
    if (Number(n) > 0) {
      throw new BadRequestException(this.t('chart_of_accounts.has_journal_lines'));
    }
    await this.accountRepository.delete(id);
  }

  /** A live overview rather than a fake step-by-step checklist with
   * unverifiable "done" states (e.g. "reviewed your chart of accounts" can't
   * actually be detected) — just the real counts a bookkeeper would want to
   * see before trusting the reports: how big the chart of accounts is, how
   * many journal entries exist in each state, how many fixed assets are
   * tracked, and whether the trial balance actually balances. */
  async getSetupGuide() {
    const [[accountCounts], [journalEntryCounts], [fixedAssetCounts], [trialBalanceCheck]] = await Promise.all([
      this.accountRepository.manager.query(
        'SELECT COUNT(*) total, SUM(isActive) active FROM accounts',
      ),
      this.accountRepository.manager.query(
        "SELECT COUNT(*) total, SUM(status = 'DRAFT') draft, SUM(status = 'POSTED') posted FROM journal_entries",
      ),
      this.accountRepository.manager.query(
        "SELECT COUNT(*) total, SUM(status = 'ACTIVE') active FROM fixed_assets",
      ),
      this.accountRepository.manager.query(
        `SELECT COALESCE(SUM(debit), 0) totalDebit, COALESCE(SUM(credit), 0) totalCredit
         FROM journal_entry_lines jel
         INNER JOIN journal_entries je ON je.id = jel.journalEntryId
         WHERE je.status = 'POSTED'`,
      ),
    ]);
    const totalDebit = Number(trialBalanceCheck.totalDebit);
    const totalCredit = Number(trialBalanceCheck.totalCredit);
    return {
      accounts: { total: Number(accountCounts.total), active: Number(accountCounts.active ?? 0) },
      journalEntries: {
        total: Number(journalEntryCounts.total),
        draft: Number(journalEntryCounts.draft ?? 0),
        posted: Number(journalEntryCounts.posted ?? 0),
      },
      fixedAssets: { total: Number(fixedAssetCounts.total), active: Number(fixedAssetCounts.active ?? 0) },
      trialBalanceBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }
}
