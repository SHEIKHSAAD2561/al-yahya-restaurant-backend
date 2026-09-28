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
import { StockCountService } from './stock-count.service';
import { CreateStockCountDto } from './dto/create-stock-count.dto';
import { UpdateStockCountLinesDto } from './dto/update-stock-count-lines.dto';
import { QueryStockCountsDto } from './dto/query-stock-counts.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/authenticated-request';

@Controller('stock-count')
export class StockCountController {
  constructor(private readonly stockCountService: StockCountService) {}

  @Get()
  @RequirePermissions('stock.access')
  findAll(@Query() query: QueryStockCountsDto) {
    return this.stockCountService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('stock.access')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.stockCountService.findOneOrFail(id);
  }

  @Post()
  @RequirePermissions('stock.manage_counts')
  create(@Body() dto: CreateStockCountDto, @CurrentUser() user: RequestUser) {
    return this.stockCountService.create(dto, user);
  }

  @Patch(':id/lines')
  @RequirePermissions('stock.manage_counts')
  updateLines(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockCountLinesDto,
  ) {
    return this.stockCountService.updateLines(id, dto);
  }

  @Post(':id/confirm')
  @RequirePermissions('stock.manage_counts')
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.stockCountService.confirm(id);
  }

  @Delete(':id')
  @RequirePermissions('stock.manage_counts')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.stockCountService.remove(id);
  }
}
