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
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import {
  RequireAnyPermission,
  RequirePermissions,
} from '../../common/decorators/require-permissions.decorator';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  /** Read access is also granted to every feature that needs a location
   * picker/filter without owning `settings.locations.manage`: Cash
   * Management, the Sale Invoices/Invoice List location filter, and
   * Promotions' location targeting (same reasoning as the
   * `products.access`/`pos.access` any-of gap fixed for the Sell Screen). */
  @Get()
  @RequireAnyPermission(
    'settings.locations.manage',
    'pos.access',
    'pos.manage_cash',
    'pos.view_sale_invoices',
    'pos.manage_promotions',
  )
  findAll() {
    return this.locationsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('settings.locations.manage')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.findOneOrFail(id);
  }

  @Post()
  @RequirePermissions('settings.locations.manage')
  create(@Body() dto: CreateLocationDto) {
    return this.locationsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('settings.locations.manage')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('settings.locations.manage')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.remove(id);
  }
}
