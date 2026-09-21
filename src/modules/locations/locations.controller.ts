import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @RequirePermissions('settings.locations.manage')
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
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLocationDto) {
    return this.locationsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('settings.locations.manage')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.remove(id);
  }
}
