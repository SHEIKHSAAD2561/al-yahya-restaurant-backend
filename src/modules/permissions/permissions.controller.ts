import { Controller, Get } from '@nestjs/common';
import { I18nLang } from 'nestjs-i18n';
import { PermissionsService } from './permissions.service';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('settings.roles.view')
  findAll(@I18nLang() lang: string) {
    return this.permissionsService.findAllGroupedByModule(lang);
  }
}
