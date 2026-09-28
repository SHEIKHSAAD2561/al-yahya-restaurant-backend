import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { SupplierPaymentsService } from './supplier-payments.service';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { QuerySupplierPaymentsDto } from './dto/query-supplier-payments.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/authenticated-request';

@Controller('supplier-payments')
export class SupplierPaymentsController {
  constructor(
    private readonly supplierPaymentsService: SupplierPaymentsService,
  ) {}

  @Get()
  @RequirePermissions('purchases_suppliers.view_credit_balance')
  findAll(@Query() query: QuerySupplierPaymentsDto) {
    return this.supplierPaymentsService.findAll(query);
  }

  @Post()
  @RequirePermissions('purchases_suppliers.manage_suppliers_payables')
  create(
    @Body() dto: CreateSupplierPaymentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.supplierPaymentsService.create(dto, user);
  }

  @Delete(':id')
  @RequirePermissions('purchases_suppliers.manage_suppliers_payables')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.supplierPaymentsService.remove(id);
  }
}
