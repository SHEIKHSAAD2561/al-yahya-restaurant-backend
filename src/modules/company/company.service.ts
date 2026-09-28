import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { FirebaseStorageService } from '../storage/firebase-storage.service';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly storageService: FirebaseStorageService,
  ) {}

  /** Single-tenant — there's exactly one row. Auto-creates an empty one on
   * first access rather than requiring a separate "set up your company" step. */
  async findOrCreate(): Promise<Company> {
    const [existing] = await this.companyRepository.find({ take: 1 });
    if (existing) return existing;

    const created = this.companyRepository.create({});
    return this.companyRepository.save(created);
  }

  async update(dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findOrCreate();
    Object.assign(company, dto);
    return this.companyRepository.save(company);
  }

  async saveLogo(
    buffer: Buffer,
    originalName: string,
    contentType: string,
  ): Promise<Company> {
    const company = await this.findOrCreate();

    const ext = originalName.includes('.')
      ? originalName.split('.').pop()
      : 'png';
    const path = `company/${randomUUID()}.${ext}`;
    const downloadUrl = await this.storageService.uploadFile(
      buffer,
      path,
      contentType,
    );

    const previousLogoUrl = company.logoUrl;
    company.logoUrl = downloadUrl;
    const saved = await this.companyRepository.save(company);

    if (previousLogoUrl) {
      await this.storageService.deleteByDownloadUrl(previousLogoUrl);
    }

    return saved;
  }
}
