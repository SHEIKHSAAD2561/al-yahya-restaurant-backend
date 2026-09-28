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
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { UpdatePromotionStatusDto } from './dto/update-promotion-status.dto';
import { QueryPromotionsDto } from './dto/query-promotions.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

/**
 * `pos.manage_promotions` for everything — catalog/management only. Nothing
 * here is enforced at checkout yet (see `Promotion` entity docblock); this is
 * a deliberate phase boundary, same as Registers shipping before Sell Screen.
 */
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  @RequirePermissions('pos.manage_promotions')
  findAll(@Query() query: QueryPromotionsDto) {
    return this.promotionsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('pos.manage_promotions')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionsService.findOneOrFail(id);
  }

  @Post()
  @RequirePermissions('pos.manage_promotions')
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('pos.manage_promotions')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.promotionsService.update(id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('pos.manage_promotions')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePromotionStatusDto,
  ) {
    return this.promotionsService.updateStatus(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('pos.manage_promotions')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionsService.remove(id);
  }
}
