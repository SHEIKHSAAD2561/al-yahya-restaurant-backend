import { Request } from 'express';
import { RoleType } from '../../modules/roles/role-type.enum';
import { UserStatus } from '../../modules/users/user-status.enum';

export interface RequestUser {
  id: string;
  email: string;
  nameEn: string;
  nameAr: string;
  roleId: string;
  roleType: RoleType;
  status: UserStatus;
  permissionCodes: Set<string>;
}

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}
