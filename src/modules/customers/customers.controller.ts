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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions('customers.access')
  findAll(@Query() query: QueryCustomersDto) {
    return this.customersService.findAll(query);
  }

  /** Backs the POS "Add Customer" search — same permission as the page that
   * hosts it (`pos.access`), not `customers.access`, since a cashier without
   * any Customers-module access still needs to attach a customer to a sale. */
  @Get('search')
  @RequirePermissions('pos.access')
  search(@Query('q') term = '') {
    return this.customersService.search(term);
  }

  @Get('generate-code')
  @RequirePermissions('customers.create')
  generateCode() {
    return this.customersService.generateCode();
  }

  @Get('export')
  @RequirePermissions('customers.export')
  async exportCsv(@Query() query: QueryCustomersDto, @Res() res: Response) {
    const csv = await this.customersService.exportCsv(query);
    res
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="customers.csv"')
      .send(csv);
  }

  /** Backs the Customer Payments page's "Total Outstanding" card — one
   * aggregate query across every customer, not a fetch-the-whole-list-and-sum
   * (the customer list is paginated, unlike Suppliers' full list). */
  @Get('receivables-summary')
  @RequirePermissions('customers.view_balances')
  receivablesSummary() {
    return this.customersService.receivablesSummary();
  }

  @Get(':id')
  @RequirePermissions('customers.access')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOneWithBalance(id);
  }

  @Post()
  @RequirePermissions('customers.create')
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  /** The POS "Add Customer" modal's inline "+" — name + phone only, needs
   * only `pos.access` like the search above, not `customers.create`. */
  @Post('quick')
  @RequirePermissions('pos.access')
  quickCreate(@Body('name') name: string, @Body('phone') phone: string) {
    return this.customersService.quickCreate(name, phone);
  }

  @Patch(':id')
  @RequirePermissions('customers.edit')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('customers.delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.remove(id);
  }
}
