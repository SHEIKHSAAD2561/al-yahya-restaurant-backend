import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { QueryReportsDto } from './dto/query-reports.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @RequirePermissions('reports.access')
  getReport(@Query() query: QueryReportsDto) {
    return this.reportsService.getReport(query);
  }
}
