import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { QueryAccountsDto } from './dto/query-accounts.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('accounts')
export class ChartOfAccountsController {
  constructor(private readonly chartOfAccountsService: ChartOfAccountsService) {}

  @Get()
  @RequirePermissions('accounting.access')
  findAll(@Query() query: QueryAccountsDto) {
    return this.chartOfAccountsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('accounting.access')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.chartOfAccountsService.findOneOrFail(id);
  }

  @Post()
  @RequirePermissions('accounting.manage_chart_of_accounts')
  create(@Body() dto: CreateAccountDto) {
    return this.chartOfAccountsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('accounting.manage_chart_of_accounts')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAccountDto) {
    return this.chartOfAccountsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('accounting.manage_chart_of_accounts')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.chartOfAccountsService.remove(id);
  }
}
