import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { SalesService } from './sales.service';
import { ParkSaleDto } from './dto/park-sale.dto';
import { CheckoutSaleDto } from './dto/checkout-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import {
  RequireAnyPermission,
  RequirePermissions,
} from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/authenticated-request';

/**
 * `pos.access` covers ordinary POS use (park/resume/checkout); `pos.park_sale`
 * additionally gates parking/resuming/discarding specifically;
 * `pos.view_sale_invoices` gates the Invoice List. Fine-grained things a
 * request tries to do beyond that (wholesale, price/discount edits) are
 * re-checked inside SalesService against the caller's own permissions —
 * never trust what the client claims it's allowed to do.
 *
 * `GET /sales` and `GET /sales/:id` also accept `pos.manage_cash` — Cash
 * Management's "Session Invoices" reuses these same two routes, and a user
 * who can reconcile registers shouldn't need the separate Invoice List
 * permission just to see that session's own sales (same reasoning as the
 * `products.access`/`pos.access` any-of gap fixed for the Sell Screen).
 */
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @RequireAnyPermission('pos.view_sale_invoices', 'pos.manage_cash')
  findAll(@Query() query: QuerySalesDto) {
    return this.salesService.findAll(query);
  }

  @Get('export')
  @RequireAnyPermission('pos.view_sale_invoices', 'pos.manage_cash')
  async exportCsv(@Query() query: QuerySalesDto, @Res() res: Response) {
    const csv = await this.salesService.exportCsv(query);
    res
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="sale-invoices.csv"')
      .send(csv);
  }

  @Get('parked')
  @RequirePermissions('pos.access', 'pos.park_sale')
  listParked(@Query('registerId', ParseUUIDPipe) registerId: string) {
    return this.salesService.listParked(registerId);
  }

  @Get('parked/:id')
  @RequirePermissions('pos.access', 'pos.park_sale')
  getParkedDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.getParkedDetail(id);
  }

  @Delete('parked/:id')
  @RequirePermissions('pos.access', 'pos.park_sale')
  discardParked(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.discardParked(id);
  }

  @Post('park')
  @RequirePermissions('pos.access', 'pos.park_sale')
  park(@Body() dto: ParkSaleDto, @CurrentUser() user: RequestUser) {
    return this.salesService.park(dto, user);
  }

  @Post('checkout')
  @RequirePermissions('pos.access')
  checkout(@Body() dto: CheckoutSaleDto, @CurrentUser() user: RequestUser) {
    return this.salesService.checkout(dto, user);
  }

  @Get(':id')
  @RequireAnyPermission('pos.view_sale_invoices', 'pos.manage_cash')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.findOneOrFail(id);
  }
}
