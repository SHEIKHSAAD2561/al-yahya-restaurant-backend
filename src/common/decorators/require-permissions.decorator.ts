import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Gates a route behind one or more permission codes (e.g. 'settings.users.manage').
 * All listed codes must be present on the requesting user's role.
 * Routes without this decorator are only subject to authentication, not authorization.
 */
export const RequirePermissions = (...codes: string[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, codes);

export const REQUIRE_ANY_PERMISSION_KEY = 'requiredAnyPermission';

/**
 * Gates a route behind *at least one* of the listed codes — for actions
 * shared by two flows (e.g. uploading a product image while creating *or*
 * editing a product). Can be combined with @RequirePermissions().
 */
export const RequireAnyPermission = (...codes: string[]) =>
  SetMetadata(REQUIRE_ANY_PERMISSION_KEY, codes);
