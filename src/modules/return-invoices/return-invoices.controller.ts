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
import { ReturnInvoicesService } from './return-invoices.service';
import { CreateReturnInvoiceDto } from './dto/create-return-invoice.dto';
import { UpdateReturnInvoiceDto } from './dto/update-return-invoice.dto';
import { QueryReturnInvoicesDto } from './dto/query-return-invoices.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/authenticated-request';

@Controller('return-invoices')
export class ReturnInvoicesController {
  constructor(private readonly returnInvoicesService: ReturnInvoicesService) {}

  @Get()
  @RequirePermissions('purchases_suppliers.access')
  findAll(@Query() query: QueryReturnInvoicesDto) {
    return this.returnInvoicesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('purchases_suppliers.access')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.returnInvoicesService.findOneOrFail(id);
  }

  @Post()
  @RequirePermissions('purchases_suppliers.record_returns')
  create(
    @Body() dto: CreateReturnInvoiceDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.returnInvoicesService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions('purchases_suppliers.record_returns')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReturnInvoiceDto,
  ) {
    return this.returnInvoicesService.update(id, dto);
  }

  @Post(':id/confirm')
  @RequirePermissions('purchases_suppliers.record_returns')
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.returnInvoicesService.confirm(id);
  }

  @Delete(':id')
  @RequirePermissions('purchases_suppliers.record_returns')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.returnInvoicesService.remove(id);
  }
}
