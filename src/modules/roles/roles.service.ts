import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Role } from './role.entity';
import { RoleType } from './role-type.enum';
import { Permission } from '../permissions/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { RoleResponseDto } from './role-response.dto';

/**
 * All the "who can do what to which role" business rules live here, not in
 * guards. PermissionsGuard only ever checks a permission code (both Super
 * Admin and Admin hold every code, so they pass uniformly); the extra
 * restrictions below (singular/hidden Super Admin, locked Admin, only Super
 * Admin creates/deletes custom roles) are enforced explicitly per-call.
 */
@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  private toResponseDto(role: Role, lang: string): RoleResponseDto {
    return {
      id: role.id,
      name: lang === 'ar' ? role.nameAr : role.nameEn,
      description: (lang === 'ar' ? role.descriptionAr : role.descriptionEn) ?? null,
      type: role.type,
      isLocked: role.type === RoleType.SUPER_ADMIN || role.type === RoleType.ADMIN,
      isDeletable: role.type === RoleType.CUSTOM,
      permissionCodes: (role.permissions ?? []).map((p) => p.code),
    };
  }

  async findAll(lang: string): Promise<RoleResponseDto[]> {
    const roles = await this.roleRepository.find({
      where: { type: Not(RoleType.SUPER_ADMIN) },
      relations: { permissions: true },
      order: { createdAt: 'ASC' },
    });
    return roles.map((role) => this.toResponseDto(role, lang));
  }

  async findOne(id: string, lang: string): Promise<RoleResponseDto> {
    const role = await this.findVisibleRoleOrFail(id);
    return this.toResponseDto(role, lang);
  }

  async create(dto: CreateRoleDto, requestingRoleType: RoleType): Promise<RoleResponseDto> {
    if (requestingRoleType !== RoleType.SUPER_ADMIN) {
      throw new ForbiddenException(this.t('roles.only_super_admin_can_create'));
    }

    const existing = await this.roleRepository.findOne({ where: { nameEn: dto.nameEn } });
    if (existing) {
      throw new ConflictException(this.t('roles.name_already_exists'));
    }

    const role = this.roleRepository.create({
      nameEn: dto.nameEn,
      nameAr: dto.nameAr,
      descriptionEn: dto.descriptionEn ?? null,
      descriptionAr: dto.descriptionAr ?? null,
      type: RoleType.CUSTOM,
      permissions: [],
    });
    const saved = await this.roleRepository.save(role);
    return this.toResponseDto(saved, 'en');
  }

  async updatePermissions(
    id: string,
    dto: UpdateRolePermissionsDto,
    lang: string,
  ): Promise<RoleResponseDto> {
    const role = await this.findVisibleRoleOrFail(id);

    if (role.type === RoleType.SUPER_ADMIN || role.type === RoleType.ADMIN) {
      throw new ForbiddenException(this.t('roles.cannot_modify_locked_role'));
    }

    const permissions = await this.permissionRepository.find({
      where: { code: In(dto.permissionCodes) },
    });
    if (permissions.length !== dto.permissionCodes.length) {
      throw new BadRequestException('One or more permission codes are invalid.');
    }

    role.permissions = permissions;
    const saved = await this.roleRepository.save(role);
    return this.toResponseDto(saved, lang);
  }

  async remove(id: string, requestingRoleType: RoleType): Promise<void> {
    if (requestingRoleType !== RoleType.SUPER_ADMIN) {
      throw new ForbiddenException(this.t('roles.only_super_admin_can_delete'));
    }

    const role = await this.findVisibleRoleOrFail(id);
    if (role.type !== RoleType.CUSTOM) {
      throw new ForbiddenException(this.t('roles.cannot_delete_system_role'));
    }

    await this.roleRepository.remove(role);
  }

  /** Internal: loads a role by id for other services (e.g. UsersService) without response shaping. */
  async findEntityById(id: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { id } });
  }

  private async findVisibleRoleOrFail(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: { permissions: true },
    });
    if (!role || role.type === RoleType.SUPER_ADMIN) {
      throw new NotFoundException(this.t('roles.not_found'));
    }
    return role;
  }
}
