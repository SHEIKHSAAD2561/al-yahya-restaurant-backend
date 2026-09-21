import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Gates a route behind one or more permission codes (e.g. 'settings.users.manage').
 * All listed codes must be present on the requesting user's role.
 * Routes without this decorator are only subject to authentication, not authorization.
 */
export const RequirePermissions = (...codes: string[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, codes);
