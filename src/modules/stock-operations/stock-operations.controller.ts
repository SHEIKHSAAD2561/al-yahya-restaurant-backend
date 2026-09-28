import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { StockOperationsService } from './stock-operations.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateStockMovementDto } from './dto/update-stock-movement.dto';
import { QueryStockMovementsDto } from './dto/query-stock-movements.dto';
import {
  RequireAnyPermission,
  RequirePermissions,
} from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/authenticated-request';

@Controller('stock-operations')
export class StockOperationsController {
  constructor(
    private readonly stockOperationsService: StockOperationsService,
  ) {}

  @Get()
  @RequirePermissions('stock.access')
  findAll(@Query() query: QueryStockMovementsDto) {
    return this.stockOperationsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('stock.access')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.stockOperationsService.findOneOrFail(id);
  }

  @Post()
  @RequireAnyPermission('stock.record_draft', 'stock.manage_movements')
  create(
    @Body() dto: CreateStockMovementDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.stockOperationsService.create(dto, user);
  }

  @Patch(':id')
  @RequireAnyPermission('stock.record_draft', 'stock.manage_movements')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockMovementDto,
  ) {
    return this.stockOperationsService.update(id, dto);
  }

  @Post(':id/confirm')
  @RequirePermissions('stock.manage_movements')
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.stockOperationsService.confirm(id);
  }

  @Delete(':id')
  @RequireAnyPermission('stock.record_draft', 'stock.manage_movements')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.stockOperationsService.remove(id);
  }
}
