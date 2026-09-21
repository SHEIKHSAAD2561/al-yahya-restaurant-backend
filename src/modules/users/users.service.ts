import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { User } from './user.entity';
import { UserStatus } from './user-status.enum';
import { Language } from './language.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { RolesService } from '../roles/roles.service';
import { RoleType } from '../roles/role-type.enum';
import { Location } from '../locations/location.entity';
import { MailService } from '../mail/mail.service';
import { generateRawToken, hashToken } from '../../common/utils/token.util';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    private readonly rolesService: RolesService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  async findAll(query: QueryUsersDto): Promise<User[]> {
    const base: FindOptionsWhere<User> = {};
    if (query.roleId) base.roleId = query.roleId;
    if (query.status) base.status = query.status;

    const where: FindOptionsWhere<User> | FindOptionsWhere<User>[] = query.search
      ? [
          { ...base, nameEn: ILike(`%${query.search}%`) },
          { ...base, nameAr: ILike(`%${query.search}%`) },
        ]
      : base;

    return this.userRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: { locations: true },
    });
  }

  async findOneOrFail(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { locations: true },
    });
    if (!user) {
      throw new NotFoundException(this.t('users.not_found'));
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /** Loads a user with role + role.permissions eagerly joined — used by JwtStrategy/AuthService. */
  async findAuthProfile(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { role: { permissions: true } },
    });
  }

  async touchLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  async findByPasswordResetTokenHash(tokenHash: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { passwordResetTokenHash: tokenHash } });
  }

  /** Sets the user's password and clears the invite/reset token. Activates a PENDING user. */
  async setPassword(id: string, passwordHash: string): Promise<User> {
    const user = await this.findOneOrFail(id);
    user.passwordHash = passwordHash;
    user.passwordResetTokenHash = null;
    user.passwordResetTokenExpiresAt = null;
    if (user.status === UserStatus.PENDING) {
      user.status = UserStatus.ACTIVE;
    }
    return this.userRepository.save(user);
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(this.t('users.email_already_exists'));
    }

    const role = await this.rolesService.findEntityById(dto.roleId);
    if (!role) {
      throw new BadRequestException('Role not found.');
    }
    if (role.type === RoleType.SUPER_ADMIN) {
      throw new ForbiddenException(this.t('users.cannot_assign_super_admin'));
    }

    const allLocations = dto.allLocations ?? true;
    const locations = allLocations
      ? []
      : await this.resolveLocations(dto.locationIds ?? []);

    const { rawToken, tokenHash, expiresAt } = this.generateResetToken();

    const user = this.userRepository.create({
      nameEn: dto.nameEn,
      nameAr: dto.nameAr,
      email: dto.email,
      phone: dto.phone ?? null,
      roleId: dto.roleId,
      allLocations,
      locations,
      preferredLanguage: dto.preferredLanguage ?? undefined,
      status: UserStatus.PENDING,
      passwordHash: null,
      passwordResetTokenHash: tokenHash,
      passwordResetTokenExpiresAt: expiresAt,
    });
    const saved = await this.userRepository.save(user);

    // The user record is the source of truth and is already committed; a failed
    // invite email shouldn't roll back a successful user creation (the invite
    // token is stored either way and this user can be re-invited later).
    try {
      await this.mailService.sendInvitationEmail(
        saved.email,
        saved.preferredLanguage === Language.AR ? saved.nameAr : saved.nameEn,
        rawToken,
        saved.preferredLanguage,
      );
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${saved.email}`, error as Error);
    }

    return saved;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOneOrFail(id);

    if (dto.roleId) {
      const role = await this.rolesService.findEntityById(dto.roleId);
      if (!role) {
        throw new BadRequestException('Role not found.');
      }
      if (role.type === RoleType.SUPER_ADMIN) {
        throw new ForbiddenException(this.t('users.cannot_assign_super_admin'));
      }
      // `role` is eager-loaded on `user` (stale, still the old role) — TypeORM
      // persists @ManyToOne relations from the loaded relation object, not the
      // raw FK column, so writing only `user.roleId` here gets silently
      // discarded on save() in favor of the stale `user.role`. Keep both in sync.
      user.roleId = dto.roleId;
      user.role = role;
    }

    if (dto.nameEn !== undefined) user.nameEn = dto.nameEn;
    if (dto.nameAr !== undefined) user.nameAr = dto.nameAr;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.preferredLanguage !== undefined) user.preferredLanguage = dto.preferredLanguage;

    if (dto.allLocations !== undefined) {
      user.allLocations = dto.allLocations;
      user.locations = dto.allLocations ? [] : await this.resolveLocations(dto.locationIds ?? []);
    }

    return this.userRepository.save(user);
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto): Promise<User> {
    const user = await this.findOneOrFail(id);

    if (user.status === UserStatus.PENDING && dto.status === UserStatus.ACTIVE) {
      throw new BadRequestException(
        'This user must accept their invitation before being activated.',
      );
    }

    user.status = dto.status;
    return this.userRepository.save(user);
  }

  /** Issues a fresh reset token for an existing user (forgot-password flow) —
   * the same token/expiry mechanism `create()` uses for invites, consumed by
   * the same `POST /auth/accept-invitation` endpoint either way. */
  async createPasswordResetToken(id: string): Promise<{ rawToken: string; user: User }> {
    const user = await this.findOneOrFail(id);
    const { rawToken, tokenHash, expiresAt } = this.generateResetToken();
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetTokenExpiresAt = expiresAt;
    const saved = await this.userRepository.save(user);
    return { rawToken, user: saved };
  }

  private async resolveLocations(locationIds: string[]): Promise<Location[]> {
    if (locationIds.length === 0) return [];
    const locations = await this.locationRepository.find({ where: { id: In(locationIds) } });
    if (locations.length !== locationIds.length) {
      throw new BadRequestException('One or more locations are invalid.');
    }
    return locations;
  }

  private generateResetToken() {
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresInHours = Number(
      this.configService.get<string>('INVITE_TOKEN_EXPIRES_IN_HOURS', '48'),
    );
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    return { rawToken, tokenHash, expiresAt };
  }
}
