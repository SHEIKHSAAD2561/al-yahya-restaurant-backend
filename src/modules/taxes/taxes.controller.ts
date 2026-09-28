import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { TaxesService } from './taxes.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { UpdateTaxStatusDto } from './dto/update-tax-status.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('taxes')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Get()
  @RequirePermissions('settings.financial_settings')
  findAll() {
    return this.taxesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('settings.financial_settings')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.taxesService.findOneOrFail(id);
  }

  @Post()
  @RequirePermissions('settings.financial_settings')
  create(@Body() dto: CreateTaxDto) {
    return this.taxesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('settings.financial_settings')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaxDto) {
    return this.taxesService.update(id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('settings.financial_settings')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaxStatusDto,
  ) {
    return this.taxesService.updateStatus(id, dto.isActive);
  }
}
