import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRE_ANY_PERMISSION_KEY,
  REQUIRE_PERMISSIONS_KEY,
} from '../decorators/require-permissions.decorator';
import { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * Deliberately dumb: it only ever compares request.user.permissionCodes
 * against @RequirePermissions() metadata. There is no role-name
 * special-casing here — Super Admin and Admin pass because they are seeded
 * with every permission code, not because this guard knows they exist.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    const requiredAll =
      this.reflector.getAllAndOverride<string[]>(
        REQUIRE_PERMISSIONS_KEY,
        targets,
      ) ?? [];
    const requiredAny =
      this.reflector.getAllAndOverride<string[]>(
        REQUIRE_ANY_PERMISSION_KEY,
        targets,
      ) ?? [];

    if (requiredAll.length === 0 && requiredAny.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userPermissions = request.user?.permissionCodes ?? new Set<string>();

    const hasAll = requiredAll.every((code) => userPermissions.has(code));
    const hasAny =
      requiredAny.length === 0 ||
      requiredAny.some((code) => userPermissions.has(code));
    if (!hasAll || !hasAny) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }

    return true;
  }
}
