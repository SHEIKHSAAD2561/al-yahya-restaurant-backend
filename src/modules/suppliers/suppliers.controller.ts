import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @RequirePermissions('purchases_suppliers.access')
  findAll() {
    return this.suppliersService.findAll();
  }

  @Get(':id')
  @RequirePermissions('purchases_suppliers.access')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.findOneOrFail(id);
  }

  @Post()
  @RequirePermissions('purchases_suppliers.manage_suppliers_payables')
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('purchases_suppliers.manage_suppliers_payables')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('purchases_suppliers.manage_suppliers_payables')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.deactivate(id);
  }
}
