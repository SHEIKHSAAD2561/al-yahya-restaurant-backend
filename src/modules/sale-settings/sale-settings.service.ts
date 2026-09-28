import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleSettings } from './sale-settings.entity';
import { UpdateSaleSettingsDto } from './dto/update-sale-settings.dto';

@Injectable()
export class SaleSettingsService {
  constructor(
    @InjectRepository(SaleSettings)
    private readonly saleSettingsRepository: Repository<SaleSettings>,
  ) {}

  /** Single row, auto-created on first access — same pattern as `Configuration`. */
  async findOrCreate(): Promise<SaleSettings> {
    const [existing] = await this.saleSettingsRepository.find({ take: 1 });
    if (existing) return existing;
    return this.saleSettingsRepository.save(
      this.saleSettingsRepository.create({}),
    );
  }

  async get(): Promise<SaleSettings> {
    return this.findOrCreate();
  }

  async update(dto: UpdateSaleSettingsDto): Promise<SaleSettings> {
    const settings = await this.findOrCreate();
    Object.assign(settings, dto);
    return this.saleSettingsRepository.save(settings);
  }
}
