import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { FixedAssetsService } from './fixed-assets.service';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';
import { UpdateFixedAssetDto } from './dto/update-fixed-asset.dto';
import { QueryFixedAssetsDto } from './dto/query-fixed-assets.dto';
import { RecordDepreciationDto } from './dto/record-depreciation.dto';
import { DisposeFixedAssetDto } from './dto/dispose-fixed-asset.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/authenticated-request';

@Controller('fixed-assets')
export class FixedAssetsController {
  constructor(private readonly fixedAssetsService: FixedAssetsService) {}

  @Get()
  @RequirePermissions('accounting.access')
  findAll(@Query() query: QueryFixedAssetsDto) {
    return this.fixedAssetsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('accounting.access')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.fixedAssetsService.findOneOrFail(id);
  }

  @Get(':id/depreciation-entries')
  @RequirePermissions('accounting.access')
  listDepreciationEntries(@Param('id', ParseUUIDPipe) id: string) {
    return this.fixedAssetsService.listDepreciationEntries(id);
  }

  @Post()
  @RequirePermissions('accounting.manage_fixed_assets')
  create(@Body() dto: CreateFixedAssetDto, @CurrentUser() user: RequestUser) {
    return this.fixedAssetsService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions('accounting.manage_fixed_assets')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFixedAssetDto) {
    return this.fixedAssetsService.update(id, dto);
  }

  @Post(':id/depreciation-entries')
  @RequirePermissions('accounting.manage_fixed_assets')
  recordDepreciation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordDepreciationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.fixedAssetsService.recordDepreciation(id, dto, user);
  }

  @Post(':id/dispose')
  @RequirePermissions('accounting.manage_fixed_assets')
  dispose(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DisposeFixedAssetDto) {
    return this.fixedAssetsService.dispose(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('accounting.manage_fixed_assets')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.fixedAssetsService.remove(id);
  }
}
