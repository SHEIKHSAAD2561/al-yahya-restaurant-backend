import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CustomerPaymentsService } from './customer-payments.service';
import { CreateCustomerPaymentDto } from './dto/create-customer-payment.dto';
import { QueryCustomerPaymentsDto } from './dto/query-customer-payments.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/authenticated-request';

@Controller('customer-payments')
export class CustomerPaymentsController {
  constructor(private readonly customerPaymentsService: CustomerPaymentsService) {}

  @Get()
  @RequirePermissions('customers.view_balances')
  findAll(@Query() query: QueryCustomerPaymentsDto) {
    return this.customerPaymentsService.findAll(query);
  }

  @Post()
  @RequirePermissions('customers.manage_settlements')
  create(@Body() dto: CreateCustomerPaymentDto, @CurrentUser() user: RequestUser) {
    return this.customerPaymentsService.create(dto, user);
  }

  @Delete(':id')
  @RequirePermissions('customers.manage_settlements')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerPaymentsService.remove(id);
  }
}
