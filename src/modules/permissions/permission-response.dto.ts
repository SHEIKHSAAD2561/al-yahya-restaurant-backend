import { PermissionModule } from './permission-module.enum';

export class PermissionResponseDto {
  id: string;
  module: PermissionModule;
  code: string;
  description: string;
}
