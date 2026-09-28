import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Location } from './location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  findAll(): Promise<Location[]> {
    return this.locationRepository.find({ order: { name: 'ASC' } });
  }

  async findOneOrFail(id: string): Promise<Location> {
    const location = await this.locationRepository.findOne({ where: { id } });
    if (!location) {
      throw new NotFoundException(this.t('locations.not_found'));
    }
    return location;
  }

  async create(dto: CreateLocationDto): Promise<Location> {
    const isFirstLocation = (await this.locationRepository.count()) === 0;
    const isDefault = isFirstLocation || (dto.isDefault ?? false);

    if (isDefault) {
      await this.clearExistingDefault();
    }

    const location = this.locationRepository.create({
      name: dto.name,
      address: dto.address ?? null,
      isDefault,
    });
    return this.locationRepository.save(location);
  }

  async update(id: string, dto: UpdateLocationDto): Promise<Location> {
    const location = await this.findOneOrFail(id);

    if (dto.name !== undefined) location.name = dto.name;
    if (dto.address !== undefined) location.address = dto.address;
    if (dto.isActive !== undefined) location.isActive = dto.isActive;

    // Only handle `isDefault: true` (a "make this the default" action) — the
    // default can only move to another location, never be unset to nothing.
    if (dto.isDefault === true && !location.isDefault) {
      await this.clearExistingDefault();
      location.isDefault = true;
    }

    return this.locationRepository.save(location);
  }

  async remove(id: string): Promise<void> {
    const location = await this.findOneOrFail(id);
    if (location.isDefault) {
      throw new BadRequestException(this.t('locations.cannot_delete_default'));
    }
    await this.locationRepository.remove(location);
  }

  private async clearExistingDefault(): Promise<void> {
    await this.locationRepository.update(
      { isDefault: true },
      { isDefault: false },
    );
  }
}
