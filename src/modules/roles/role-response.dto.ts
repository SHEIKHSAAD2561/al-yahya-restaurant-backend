import { RoleType } from './role-type.enum';

export class RoleResponseDto {
  id: string;
  name: string;
  description: string | null;
  type: RoleType;
  isLocked: boolean;
  isDeletable: boolean;
  permissionCodes: string[];
}
