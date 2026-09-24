import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from './refresh-token.entity';
import { UsersService } from '../users/users.service';
import { UserStatus } from '../users/user-status.enum';
import { Language } from '../users/language.enum';
import { LoginDto } from './dto/login.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { AuthProfileResponseDto } from './auth-profile-response.dto';
import { MailService } from '../mail/mail.service';
import { generateRawToken, hashToken } from '../../common/utils/token.util';
import { parseDurationToMs } from '../../common/utils/duration.util';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** ISO timestamp — when the refresh token itself expires. Once this
   * passes, no more silent access-token refreshes are possible and the user
   * must log in again; the frontend's session-expiry warning schedules
   * against this, not the (silently, invisibly renewed) access token. */
  refreshTokenExpiresAt: string;
}

interface IssuedTokenPair extends TokenPair {
  refreshTokenId: string;
}

interface RequestMetadata {
  userAgent?: string;
  ipAddress?: string;
}

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  async login(dto: LoginDto, meta: RequestMetadata = {}): Promise<TokenPair> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(this.t('auth.invalid_credentials'));
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException(this.t('auth.invalid_credentials'));
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException(this.t('auth.account_inactive'));
    }
    if (user.status === UserStatus.PENDING) {
      throw new UnauthorizedException(this.t('auth.account_pending'));
    }

    await this.usersService.touchLastLogin(user.id);
    const pair = await this.issueTokenPair(user.id, meta);
    return {
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
      refreshTokenExpiresAt: pair.refreshTokenExpiresAt,
    };
  }

  async refresh(rawRefreshToken: string, meta: RequestMetadata = {}): Promise<TokenPair> {
    const tokenHash = hashToken(rawRefreshToken);
    const existing = await this.refreshTokenRepository.findOne({ where: { tokenHash } });

    if (!existing) {
      throw new UnauthorizedException(this.t('auth.invalid_refresh_token'));
    }

    if (existing.revokedAt) {
      // Reuse of an already-rotated/revoked token: treat as possible theft and
      // revoke every active session for this user.
      await this.refreshTokenRepository.update(
        { userId: existing.userId, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
      throw new UnauthorizedException(this.t('auth.invalid_refresh_token'));
    }

    if (existing.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException(this.t('auth.invalid_refresh_token'));
    }

    const user = await this.usersService.findOneOrFail(existing.userId);
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(this.t('auth.invalid_refresh_token'));
    }

    const pair = await this.issueTokenPair(user.id, meta);

    existing.revokedAt = new Date();
    existing.replacedByTokenId = pair.refreshTokenId;
    await this.refreshTokenRepository.save(existing);

    return {
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
      refreshTokenExpiresAt: pair.refreshTokenExpiresAt,
    };
  }

  async logout(userId: string, rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      await this.refreshTokenRepository.update(
        { tokenHash: hashToken(rawRefreshToken), userId },
        { revokedAt: new Date() },
      );
      return;
    }

    await this.refreshTokenRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async getProfile(userId: string, lang: string): Promise<AuthProfileResponseDto> {
    const user = await this.usersService.findAuthProfile(userId);
    if (!user) {
      throw new NotFoundException(this.t('users.not_found'));
    }

    return {
      id: user.id,
      nameEn: user.nameEn,
      nameAr: user.nameAr,
      email: user.email,
      phone: user.phone,
      status: user.status,
      preferredLanguage: user.preferredLanguage,
      role: {
        id: user.role.id,
        name: lang === 'ar' ? user.role.nameAr : user.role.nameEn,
        type: user.role.type,
      },
      permissionCodes: user.role.permissions.map((p) => p.code),
    };
  }

  async acceptInvitation(dto: AcceptInvitationDto): Promise<void> {
    const tokenHash = hashToken(dto.token);
    const user = await this.usersService.findByPasswordResetTokenHash(tokenHash);

    if (
      !user ||
      !user.passwordResetTokenExpiresAt ||
      user.passwordResetTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException(this.t('auth.invitation_invalid_or_expired'));
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    await this.usersService.setPassword(user.id, passwordHash);
  }

  /**
   * Always resolves without error, regardless of whether the email exists —
   * this must not let a caller enumerate which emails have accounts. PENDING
   * users are skipped too (they already have an unexpired invite token to use
   * instead), as are INACTIVE ones (deliberately deactivated by an admin).
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.status !== UserStatus.ACTIVE) {
      return;
    }

    const { rawToken } = await this.usersService.createPasswordResetToken(user.id);

    try {
      await this.mailService.sendPasswordResetEmail(
        user.email,
        user.preferredLanguage === Language.AR ? user.nameAr : user.nameEn,
        rawToken,
        user.preferredLanguage,
      );
    } catch {
      // Already logged inside MailService — forgotPassword must not leak
      // delivery failures to the caller either, same reasoning as above.
    }
  }

  private async issueTokenPair(userId: string, meta: RequestMetadata): Promise<IssuedTokenPair> {
    const accessToken = this.jwtService.sign({ sub: userId });

    const rawRefreshToken = generateRawToken(48);
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
    const expiresAt = new Date(Date.now() + parseDurationToMs(refreshExpiresIn));

    const refreshTokenRow = this.refreshTokenRepository.create({
      userId,
      tokenHash: hashToken(rawRefreshToken),
      expiresAt,
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
    });
    const saved = await this.refreshTokenRepository.save(refreshTokenRow);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      refreshTokenId: saved.id,
      refreshTokenExpiresAt: expiresAt.toISOString(),
    };
  }
}
