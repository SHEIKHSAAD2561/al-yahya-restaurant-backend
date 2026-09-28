import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { FixedAsset } from './entities/fixed-asset.entity';
import { FixedAssetDepreciationEntry } from './entities/fixed-asset-depreciation-entry.entity';
import { FixedAssetStatus } from './fixed-asset-status.enum';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';
import { UpdateFixedAssetDto } from './dto/update-fixed-asset.dto';
import { QueryFixedAssetsDto } from './dto/query-fixed-assets.dto';
import { RecordDepreciationDto } from './dto/record-depreciation.dto';
import { DisposeFixedAssetDto } from './dto/dispose-fixed-asset.dto';
import { Account } from '../chart-of-accounts/account.entity';
import { JournalEntriesService } from '../journal-entries/journal-entries.service';
import type { RequestUser } from '../../common/types/authenticated-request';

export interface FixedAssetListItem extends FixedAsset {
  accumulatedDepreciation: number;
  bookValue: number;
}

@Injectable()
export class FixedAssetsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(FixedAsset)
    private readonly assetRepository: Repository<FixedAsset>,
    @InjectRepository(FixedAssetDepreciationEntry)
    private readonly depreciationRepository: Repository<FixedAssetDepreciationEntry>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly journalEntriesService: JournalEntriesService,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  private async accumulatedDepreciation(fixedAssetId: string): Promise<number> {
    const row = await this.depreciationRepository
      .createQueryBuilder('entry')
      .select('COALESCE(SUM(entry.amount), 0)', 'total')
      .where('entry.fixedAssetId = :fixedAssetId', { fixedAssetId })
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }

  private async toListItem(asset: FixedAsset): Promise<FixedAssetListItem> {
    const accumulatedDepreciation = await this.accumulatedDepreciation(asset.id);
    return { ...asset, accumulatedDepreciation, bookValue: Number(asset.purchaseCost) - accumulatedDepreciation };
  }

  /** Small, fully-loaded list, like the chart of accounts — a restaurant's
   * fixed asset register is a few dozen rows at most. */
  async findAll(query: QueryFixedAssetsDto): Promise<FixedAssetListItem[]> {
    const qb = this.assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.location', 'location')
      .orderBy('asset.purchaseDate', 'DESC');
    if (query.status) qb.andWhere('asset.status = :status', { status: query.status });
    if (query.locationId) qb.andWhere('asset.locationId = :locationId', { locationId: query.locationId });
    const assets = await qb.getMany();
    return Promise.all(assets.map((asset) => this.toListItem(asset)));
  }

  async findOneOrFail(id: string): Promise<FixedAssetListItem> {
    const asset = await this.assetRepository.findOne({
      where: { id },
      relations: { location: true, assetAccount: true, accumulatedDepreciationAccount: true, depreciationExpenseAccount: true },
    });
    if (!asset) {
      throw new NotFoundException(this.t('fixed_assets.not_found'));
    }
    return this.toListItem(asset);
  }

  private async assertAccountUsable(accountId: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id: accountId } });
    if (!account || !account.isActive) {
      throw new BadRequestException(this.t('journal_entries.account_inactive'));
    }
    return account;
  }

  async create(dto: CreateFixedAssetDto, user: RequestUser): Promise<FixedAssetListItem> {
    await this.assertAccountUsable(dto.assetAccountId);
    await this.assertAccountUsable(dto.accumulatedDepreciationAccountId);
    await this.assertAccountUsable(dto.depreciationExpenseAccountId);
    if (dto.paymentAccountId) await this.assertAccountUsable(dto.paymentAccountId);

    const saved = await this.dataSource.transaction(async (manager) => {
      const asset = manager.create(FixedAsset, {
        name: dto.name.trim(),
        category: dto.category?.trim() || null,
        locationId: dto.locationId ?? null,
        assetAccountId: dto.assetAccountId,
        accumulatedDepreciationAccountId: dto.accumulatedDepreciationAccountId,
        depreciationExpenseAccountId: dto.depreciationExpenseAccountId,
        purchaseDate: dto.purchaseDate,
        purchaseCost: dto.purchaseCost,
        usefulLifeMonths: dto.usefulLifeMonths,
        salvageValue: dto.salvageValue ?? 0,
        notes: dto.notes?.trim() || null,
      });
      const savedAsset = await manager.save(asset);

      if (dto.paymentAccountId) {
        await this.journalEntriesService.postSystemEntry(
          manager,
          {
            entryDate: dto.purchaseDate,
            memo: `Purchase of fixed asset: ${savedAsset.name}`,
            lines: [
              { accountId: dto.assetAccountId, debit: dto.purchaseCost, credit: 0 },
              { accountId: dto.paymentAccountId, debit: 0, credit: dto.purchaseCost },
            ],
          },
          user,
        );
      }
      return savedAsset;
    });
    return this.toListItem(saved);
  }

  async update(id: string, dto: UpdateFixedAssetDto): Promise<FixedAssetListItem> {
    const asset = await this.assetRepository.findOne({ where: { id } });
    if (!asset) {
      throw new NotFoundException(this.t('fixed_assets.not_found'));
    }
    if (dto.name !== undefined) asset.name = dto.name.trim();
    if (dto.category !== undefined) asset.category = dto.category?.trim() || null;
    if (dto.locationId !== undefined) asset.locationId = dto.locationId;
    if (dto.assetAccountId !== undefined) {
      await this.assertAccountUsable(dto.assetAccountId);
      asset.assetAccountId = dto.assetAccountId;
    }
    if (dto.accumulatedDepreciationAccountId !== undefined) {
      await this.assertAccountUsable(dto.accumulatedDepreciationAccountId);
      asset.accumulatedDepreciationAccountId = dto.accumulatedDepreciationAccountId;
    }
    if (dto.depreciationExpenseAccountId !== undefined) {
      await this.assertAccountUsable(dto.depreciationExpenseAccountId);
      asset.depreciationExpenseAccountId = dto.depreciationExpenseAccountId;
    }
    if (dto.usefulLifeMonths !== undefined) asset.usefulLifeMonths = dto.usefulLifeMonths;
    if (dto.salvageValue !== undefined) asset.salvageValue = dto.salvageValue;
    if (dto.notes !== undefined) asset.notes = dto.notes?.trim() || null;
    const saved = await this.assetRepository.save(asset);
    return this.toListItem(saved);
  }

  async remove(id: string): Promise<void> {
    const asset = await this.assetRepository.findOne({ where: { id } });
    if (!asset) {
      throw new NotFoundException(this.t('fixed_assets.not_found'));
    }
    if (await this.depreciationRepository.exists({ where: { fixedAssetId: id } })) {
      throw new BadRequestException(this.t('fixed_assets.has_depreciation'));
    }
    await this.assetRepository.delete(id);
  }

  /** Posts one depreciation run for one period: debit Depreciation Expense,
   * credit Accumulated Depreciation. Rejects a second run for the same
   * period (`periodDate`) and rejects depreciating past the depreciable base
   * (`purchaseCost − salvageValue`) or a disposed asset. */
  async recordDepreciation(id: string, dto: RecordDepreciationDto, user: RequestUser): Promise<FixedAssetListItem> {
    const asset = await this.assetRepository.findOne({ where: { id } });
    if (!asset) {
      throw new NotFoundException(this.t('fixed_assets.not_found'));
    }
    if (asset.status === FixedAssetStatus.DISPOSED) {
      throw new BadRequestException(this.t('fixed_assets.already_disposed'));
    }
    if (await this.depreciationRepository.exists({ where: { fixedAssetId: id, periodDate: dto.periodDate } })) {
      throw new BadRequestException(this.t('fixed_assets.period_already_recorded'));
    }

    const depreciableBase = Number(asset.purchaseCost) - Number(asset.salvageValue);
    const alreadyDepreciated = await this.accumulatedDepreciation(id);
    const straightLineMonthly = depreciableBase / asset.usefulLifeMonths;
    const remaining = Math.max(0, depreciableBase - alreadyDepreciated);
    if (remaining <= 0) {
      throw new BadRequestException(this.t('fixed_assets.fully_depreciated'));
    }
    const amount = Math.min(dto.amount ?? straightLineMonthly, remaining);

    await this.dataSource.transaction(async (manager) => {
      const entry = await this.journalEntriesService.postSystemEntry(
        manager,
        {
          entryDate: dto.periodDate,
          memo: `Depreciation for ${asset.name} — ${dto.periodDate}`,
          lines: [
            { accountId: asset.depreciationExpenseAccountId, debit: amount, credit: 0 },
            { accountId: asset.accumulatedDepreciationAccountId, debit: 0, credit: amount },
          ],
        },
        user,
      );
      await manager.save(
        manager.create(FixedAssetDepreciationEntry, {
          fixedAssetId: id,
          journalEntryId: entry.id,
          periodDate: dto.periodDate,
          amount,
        }),
      );
    });
    return this.findOneOrFail(id);
  }

  async dispose(id: string, dto: DisposeFixedAssetDto): Promise<FixedAssetListItem> {
    const asset = await this.assetRepository.findOne({ where: { id } });
    if (!asset) {
      throw new NotFoundException(this.t('fixed_assets.not_found'));
    }
    if (asset.status === FixedAssetStatus.DISPOSED) {
      throw new BadRequestException(this.t('fixed_assets.already_disposed'));
    }
    asset.status = FixedAssetStatus.DISPOSED;
    asset.disposedAt = dto.disposalDate;
    const saved = await this.assetRepository.save(asset);
    return this.toListItem(saved);
  }

  async listDepreciationEntries(fixedAssetId: string): Promise<FixedAssetDepreciationEntry[]> {
    return this.depreciationRepository.find({
      where: { fixedAssetId },
      relations: { journalEntry: true },
      order: { periodDate: 'ASC' },
    });
  }
}
