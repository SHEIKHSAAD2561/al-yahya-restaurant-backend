import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { UpdateTaxConfigurationDto } from './dto/update-tax-configuration.dto';
import { UpdateLocationConfigurationDto } from './dto/update-location-configuration.dto';
import { UpdateWeightedProductConfigurationDto } from './dto/update-weighted-product-configuration.dto';
import { UpdateShippingConfigurationDto } from './dto/update-shipping-configuration.dto';
import { UpdatePaymentConfigurationDto } from './dto/update-payment-configuration.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

/** One PATCH per card on the Settings → Configuration page — each card has
 * its own Save button and saves independently of the others. */
@Controller('configuration')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @Get()
  @RequirePermissions('settings.financial_settings')
  get() {
    return this.configurationService.get();
  }

  @Get('location-options')
  @RequirePermissions('settings.financial_settings')
  listLocationOptions() {
    return this.configurationService.listLocationOptions();
  }

  @Patch('tax')
  @RequirePermissions('settings.financial_settings')
  updateTax(@Body() dto: UpdateTaxConfigurationDto) {
    return this.configurationService.updateTax(dto);
  }

  @Patch('location')
  @RequirePermissions('settings.financial_settings')
  updateLocation(@Body() dto: UpdateLocationConfigurationDto) {
    return this.configurationService.updateLocation(dto);
  }

  @Patch('weighted-product')
  @RequirePermissions('settings.financial_settings')
  updateWeightedProduct(@Body() dto: UpdateWeightedProductConfigurationDto) {
    return this.configurationService.updateWeightedProduct(dto);
  }

  @Patch('shipping')
  @RequirePermissions('settings.financial_settings')
  updateShipping(@Body() dto: UpdateShippingConfigurationDto) {
    return this.configurationService.updateShipping(dto);
  }

  @Patch('payment')
  @RequirePermissions('settings.financial_settings')
  updatePayment(@Body() dto: UpdatePaymentConfigurationDto) {
    return this.configurationService.updatePayment(dto);
  }
}
