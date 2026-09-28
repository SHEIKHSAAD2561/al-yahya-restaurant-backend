import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './permission.entity';
import { PermissionModule } from './permission-module.enum';
import { PermissionResponseDto } from './permission-response.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findAllGroupedByModule(
    lang: string,
  ): Promise<Record<PermissionModule, PermissionResponseDto[]>> {
    const permissions = await this.permissionRepository.find({
      order: { module: 'ASC', code: 'ASC' },
    });

    const grouped = {} as Record<PermissionModule, PermissionResponseDto[]>;
    for (const permission of permissions) {
      const dto: PermissionResponseDto = {
        id: permission.id,
        module: permission.module,
        code: permission.code,
        description:
          lang === 'ar' ? permission.descriptionAr : permission.descriptionEn,
      };
      (grouped[permission.module] ??= []).push(dto);
    }
    return grouped;
  }
}
