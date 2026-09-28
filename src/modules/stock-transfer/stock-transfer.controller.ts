import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { StockTransferService } from './stock-transfer.service';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { QueryStockTransfersDto } from './dto/query-stock-transfers.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/authenticated-request';

@Controller('stock-transfers')
export class StockTransferController {
  constructor(private readonly stockTransferService: StockTransferService) {}

  @Get()
  @RequirePermissions('stock.access')
  findAll(@Query() query: QueryStockTransfersDto) {
    return this.stockTransferService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('stock.access')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.stockTransferService.findOneOrFail(id);
  }

  @Post()
  @RequirePermissions('stock.request_transfer')
  create(
    @Body() dto: CreateStockTransferDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.stockTransferService.create(dto, user);
  }

  @Post(':id/cancel')
  @RequirePermissions('stock.request_transfer')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.stockTransferService.cancel(id, user);
  }

  @Post(':id/approve')
  @RequirePermissions('stock.approve_transfer')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.stockTransferService.approve(id, user);
  }

  @Post(':id/reject')
  @RequirePermissions('stock.approve_transfer')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.stockTransferService.reject(id, user);
  }
}
