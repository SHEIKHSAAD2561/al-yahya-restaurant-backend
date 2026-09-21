import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { UserStatus } from '../../users/user-status.enum';
import { RequestUser } from '../../../common/types/authenticated-request';

interface AccessTokenPayload {
  sub: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  async validate(payload: AccessTokenPayload): Promise<RequestUser> {
    const user = await this.usersService.findAuthProfile(payload.sub);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      nameEn: user.nameEn,
      nameAr: user.nameAr,
      roleId: user.roleId,
      roleType: user.role.type,
      status: user.status,
      permissionCodes: new Set(user.role.permissions.map((p) => p.code)),
    };
  }
}
