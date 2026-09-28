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
import { PurchaseInvoicesService } from './purchase-invoices.service';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { UpdatePurchaseInvoiceDto } from './dto/update-purchase-invoice.dto';
import { QueryPurchaseInvoicesDto } from './dto/query-purchase-invoices.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/authenticated-request';

@Controller('purchase-invoices')
export class PurchaseInvoicesController {
  constructor(
    private readonly purchaseInvoicesService: PurchaseInvoicesService,
  ) {}

  @Get()
  @RequirePermissions('purchases_suppliers.access')
  findAll(@Query() query: QueryPurchaseInvoicesDto) {
    return this.purchaseInvoicesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('purchases_suppliers.access')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchaseInvoicesService.findOneOrFail(id);
  }

  @Post()
  @RequirePermissions('purchases_suppliers.manage_invoices')
  create(
    @Body() dto: CreatePurchaseInvoiceDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.purchaseInvoicesService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions('purchases_suppliers.manage_invoices')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseInvoiceDto,
  ) {
    return this.purchaseInvoicesService.update(id, dto);
  }

  @Post(':id/confirm')
  @RequirePermissions('purchases_suppliers.manage_invoices')
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchaseInvoicesService.confirm(id);
  }

  @Delete(':id')
  @RequirePermissions('purchases_suppliers.manage_invoices')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchaseInvoicesService.remove(id);
  }
}
