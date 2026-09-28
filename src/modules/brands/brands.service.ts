import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Brand } from './brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  findAll(): Promise<Brand[]> {
    return this.brandRepository.find({ order: { name: 'ASC' } });
  }

  async create(dto: CreateBrandDto): Promise<Brand> {
    const name = dto.name.trim();
    if (await this.brandRepository.exists({ where: { name } })) {
      throw new ConflictException(this.t('products.brand_name_taken'));
    }
    return this.brandRepository.save(this.brandRepository.create({ name }));
  }
}
