import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { I18nLang } from 'nestjs-i18n';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/authenticated-request';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('settings.roles.view')
  findAll(@I18nLang() lang: string) {
    return this.rolesService.findAll(lang);
  }

  @Get(':id')
  @RequirePermissions('settings.roles.view')
  findOne(@Param('id', ParseUUIDPipe) id: string, @I18nLang() lang: string) {
    return this.rolesService.findOne(id, lang);
  }

  @Post()
  @RequirePermissions('settings.roles.manage')
  create(@Body() dto: CreateRoleDto, @CurrentUser() user: RequestUser) {
    return this.rolesService.create(dto, user.roleType);
  }

  @Patch(':id/permissions')
  @RequirePermissions('settings.roles.manage')
  updatePermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRolePermissionsDto,
    @I18nLang() lang: string,
  ) {
    return this.rolesService.updatePermissions(id, dto, lang);
  }

  @Delete(':id')
  @RequirePermissions('settings.roles.manage')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.rolesService.remove(id, user.roleType);
  }
}
