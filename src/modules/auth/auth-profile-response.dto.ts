import { RoleType } from '../roles/role-type.enum';
import { UserStatus } from '../users/user-status.enum';
import { Language } from '../users/language.enum';

export class AuthProfileResponseDto {
  id: string;
  nameEn: string;
  nameAr: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  preferredLanguage: Language;
  role: {
    id: string;
    name: string;
    type: RoleType;
  };
  permissionCodes: string[];
}
