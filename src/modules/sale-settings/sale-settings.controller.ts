import { Body, Controller, Get, Patch } from '@nestjs/common';
import { SaleSettingsService } from './sale-settings.service';
import { UpdateSaleSettingsDto } from './dto/update-sale-settings.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('sale-settings')
export class SaleSettingsController {
  constructor(private readonly saleSettingsService: SaleSettingsService) {}

  @Get()
  @RequirePermissions('pos.manage_sale_settings')
  get() {
    return this.saleSettingsService.get();
  }

  @Patch()
  @RequirePermissions('pos.manage_sale_settings')
  update(@Body() dto: UpdateSaleSettingsDto) {
    return this.saleSettingsService.update(dto);
  }
}
