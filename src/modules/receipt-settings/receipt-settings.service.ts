import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReceiptSettings } from './receipt-settings.entity';
import { UpdateReceiptSettingsDto } from './dto/update-receipt-settings.dto';
import { FirebaseStorageService } from '../storage/firebase-storage.service';

@Injectable()
export class ReceiptSettingsService {
  constructor(
    @InjectRepository(ReceiptSettings)
    private readonly receiptSettingsRepository: Repository<ReceiptSettings>,
    private readonly storageService: FirebaseStorageService,
  ) {}

  /** Single row, auto-created on first access — same pattern as `Configuration`. */
  async findOrCreate(): Promise<ReceiptSettings> {
    const [existing] = await this.receiptSettingsRepository.find({ take: 1 });
    if (existing) return existing;
    return this.receiptSettingsRepository.save(
      this.receiptSettingsRepository.create({}),
    );
  }

  async get(): Promise<ReceiptSettings> {
    return this.findOrCreate();
  }

  async update(dto: UpdateReceiptSettingsDto): Promise<ReceiptSettings> {
    const settings = await this.findOrCreate();
    Object.assign(settings, dto);
    return this.receiptSettingsRepository.save(settings);
  }

  async uploadCommentImage(
    buffer: Buffer,
    originalName: string,
    contentType: string,
  ): Promise<ReceiptSettings> {
    const settings = await this.findOrCreate();

    const ext = originalName.includes('.')
      ? originalName.split('.').pop()
      : 'png';
    const path = `receipt-settings/${randomUUID()}.${ext}`;
    const downloadUrl = await this.storageService.uploadFile(
      buffer,
      path,
      contentType,
    );

    const previousUrl = settings.commentImageUrl;
    settings.commentImageUrl = downloadUrl;
    const saved = await this.receiptSettingsRepository.save(settings);

    if (previousUrl) {
      await this.storageService.deleteByDownloadUrl(previousUrl);
    }
    return saved;
  }

  async removeCommentImage(): Promise<ReceiptSettings> {
    const settings = await this.findOrCreate();
    const previousUrl = settings.commentImageUrl;
    settings.commentImageUrl = null;
    const saved = await this.receiptSettingsRepository.save(settings);
    if (previousUrl) {
      await this.storageService.deleteByDownloadUrl(previousUrl);
    }
    return saved;
  }
}
