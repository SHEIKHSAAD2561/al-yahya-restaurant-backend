import { Controller, Get, Query } from '@nestjs/common';
import { DigitalMenuService } from './digital-menu.service';
import { QueryDigitalMenuDto } from './dto/query-digital-menu.dto';
import { Public } from '../../common/decorators/public.decorator';

/** Entirely public — a customer scanning a table QR code has no session.
 * Nothing served here is sensitive (see DigitalMenuService's doc comments):
 * product name/description/image/price and basic branding, the same kind of
 * information already printed on a receipt or shown on a physical menu. */
@Controller('digital-menu')
export class DigitalMenuController {
  constructor(private readonly digitalMenuService: DigitalMenuService) {}

  @Get('locations')
  @Public()
  listLocations() {
    return this.digitalMenuService.listPublicLocations();
  }

  @Get()
  @Public()
  getMenu(@Query() query: QueryDigitalMenuDto) {
    return this.digitalMenuService.getMenu(query);
  }
}
