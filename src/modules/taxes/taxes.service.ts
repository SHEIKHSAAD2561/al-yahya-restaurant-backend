import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Tax } from './tax.entity';
import { TaxLine } from './tax-line.entity';
import { TaxType } from './tax-type.enum';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { TaxLineDto } from './dto/tax-line.dto';
import { SYSTEM_TAX_CODES } from './system-tax-codes';
import { Configuration } from '../configuration/configuration.entity';
import { TaxStatus } from '../configuration/configuration.enums';

@Injectable()
export class TaxesService {
  constructor(
    @InjectRepository(Tax)
    private readonly taxRepository: Repository<Tax>,
    @InjectRepository(TaxLine)
    private readonly taxLineRepository: Repository<TaxLine>,
    @InjectRepository(Configuration)
    private readonly configurationRepository: Repository<Configuration>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  private buildLines(lines: TaxLineDto[]): TaxLine[] {
    return lines.map((line, index) =>
      this.taxLineRepository.create({
        label: line.label ?? null,
        rate: line.rate,
        sortOrder: index,
      }),
    );
  }

  findAll(): Promise<Tax[]> {
    return this.taxRepository.find({
      relations: { lines: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOneOrFail(id: string): Promise<Tax> {
    const tax = await this.taxRepository.findOne({
      where: { id },
      relations: { lines: true },
    });
    if (!tax) {
      throw new NotFoundException(this.t('taxes.not_found'));
    }
    return tax;
  }

  create(dto: CreateTaxDto): Promise<Tax> {
    const hasCompoundTax = dto.hasCompoundTax ?? false;
    const tax = this.taxRepository.create({
      name: dto.name,
      code: dto.code,
      // Every tax created through this endpoint is CUSTOM — SYSTEM_LOCKED/
      // SYSTEM_TOGGLABLE only ever come from the seed script.
      type: TaxType.CUSTOM,
      isActive: true,
      hasCompoundTax,
      compoundLabel: hasCompoundTax ? (dto.compoundLabel ?? null) : null,
      compoundRate: hasCompoundTax ? (dto.compoundRate ?? null) : null,
      lines: this.buildLines(dto.lines),
    });
    return this.taxRepository.save(tax);
  }

  async update(id: string, dto: UpdateTaxDto): Promise<Tax> {
    const tax = await this.findOneOrFail(id);
    if (tax.type !== TaxType.CUSTOM) {
      throw new ForbiddenException(this.t('taxes.system_tax_not_editable'));
    }

    if (dto.name !== undefined) tax.name = dto.name;
    if (dto.code !== undefined) tax.code = dto.code;
    if (dto.hasCompoundTax !== undefined)
      tax.hasCompoundTax = dto.hasCompoundTax;
    if (!tax.hasCompoundTax) {
      tax.compoundLabel = null;
      tax.compoundRate = null;
    } else {
      if (dto.compoundLabel !== undefined)
        tax.compoundLabel = dto.compoundLabel;
      if (dto.compoundRate !== undefined) tax.compoundRate = dto.compoundRate;
    }

    if (dto.lines !== undefined) {
      // Full replace, same philosophy as role permission updates — simpler
      // and less error-prone than diffing which lines changed.
      await this.taxLineRepository.delete({ taxId: id });
      tax.lines = this.buildLines(dto.lines);
    }

    return this.taxRepository.save(tax);
  }

  async updateStatus(id: string, isActive: boolean): Promise<Tax> {
    const tax = await this.findOneOrFail(id);
    if (tax.type !== TaxType.SYSTEM_TOGGLABLE) {
      throw new ForbiddenException(this.t('taxes.status_not_changeable'));
    }

    // The Configuration tab's default tax must stay an active tax.
    if (
      !isActive &&
      (await this.configurationRepository.exists({
        where: { defaultTaxId: id },
      }))
    ) {
      throw new BadRequestException(
        this.t('taxes.default_tax_not_deactivatable'),
      );
    }

    tax.isActive = isActive;
    return this.taxRepository.manager.transaction(async (manager) => {
      const saved = await manager.save(tax);
      // Tax-inclusive selling prices aren't allowed while the tobacco scheme
      // is on — force the stored sell tax status so it can't be left INCLUSIVE.
      if (isActive && tax.code === SYSTEM_TAX_CODES.VAT_TOBACCO) {
        await manager
          .createQueryBuilder()
          .update(Configuration)
          .set({ sellTaxStatus: TaxStatus.EXCLUSIVE })
          .execute();
      }
      return saved;
    });
  }
}
