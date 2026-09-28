import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/authenticated-request';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @RequirePermissions('dashboard.access')
  getSummary(
    @Query() query: QueryDashboardDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.dashboardService.getSummary(
      query,
      this.dashboardService.buildViewer(user),
    );
  }
}
