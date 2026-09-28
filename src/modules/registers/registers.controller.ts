import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { RegistersService } from './registers.service';
import { CreateRegisterDto } from './dto/create-register.dto';
import { UpdateRegisterDto } from './dto/update-register.dto';
import { OpenRegisterDto } from './dto/open-register.dto';
import { CloseRegisterDto } from './dto/close-register.dto';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { QuerySessionsDto } from './dto/query-sessions.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/authenticated-request';

/**
 * Register *settings* (create/update: who's assigned, payment methods,
 * printer) need `pos.manage_sale_settings` — this is POS configuration, not
 * selling. Opening/closing/cash movements need `pos.access` (using the POS)
 * plus, for cash movements specifically, `pos.manage_cash`; the service
 * additionally checks the caller is one of the register's assigned cashiers.
 * Cash Management (`/registers/sessions*`) needs `pos.manage_cash` alone —
 * it's a cross-register reconciliation view, not tied to any one register's
 * cashier list. Static-path routes (`sessions`) are declared before `:id`.
 */
@Controller('registers')
export class RegistersController {
  constructor(private readonly registersService: RegistersService) {}

  @Get()
  @RequirePermissions('pos.access')
  findAll() {
    return this.registersService.findAllGroupedByLocation();
  }

  @Get('sessions')
  @RequirePermissions('pos.manage_cash')
  listSessions(@Query() query: QuerySessionsDto) {
    return this.registersService.listSessions(query);
  }

  @Get('sessions/export')
  @RequirePermissions('pos.manage_cash')
  async exportSessionsCsv(
    @Query() query: QuerySessionsDto,
    @Res() res: Response,
  ) {
    const csv = await this.registersService.exportSessionsCsv(query);
    res
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header(
        'Content-Disposition',
        'attachment; filename="cash-management.csv"',
      )
      .send(csv);
  }

  @Get('sessions/:id')
  @RequirePermissions('pos.manage_cash')
  getSessionDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.registersService.getSessionDetail(id);
  }

  @Get('sessions/:id/movements')
  @RequirePermissions('pos.manage_cash')
  listMovementsForSession(@Param('id', ParseUUIDPipe) id: string) {
    return this.registersService.listMovementsForSession(id);
  }

  @Get(':id')
  @RequirePermissions('pos.access')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.registersService.findOne(id);
  }

  @Post()
  @RequirePermissions('pos.manage_sale_settings')
  create(@Body() dto: CreateRegisterDto) {
    return this.registersService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('pos.manage_sale_settings')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRegisterDto,
  ) {
    return this.registersService.update(id, dto);
  }

  @Post(':id/open')
  @RequirePermissions('pos.access')
  open(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OpenRegisterDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.registersService.open(id, dto, user);
  }

  @Post(':id/close')
  @RequirePermissions('pos.access')
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseRegisterDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.registersService.close(id, dto, user);
  }

  @Post(':id/cash-movements')
  @RequirePermissions('pos.access', 'pos.manage_cash')
  addCashMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCashMovementDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.registersService.addCashMovement(id, dto, user);
  }

  @Get(':id/cash-movements')
  @RequirePermissions('pos.access', 'pos.manage_cash')
  listCashMovements(@Param('id', ParseUUIDPipe) id: string) {
    return this.registersService.listCashMovements(id);
  }
}
