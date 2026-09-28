import { Controller, Get, Query } from '@nestjs/common';
import { FinancialReportsService } from './financial-reports.service';
import { AsOfDto, DateRangeDto, GeneralLedgerQueryDto } from './dto/report-period.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('financial-reports')
export class FinancialReportsController {
  constructor(private readonly financialReportsService: FinancialReportsService) {}

  @Get('trial-balance')
  @RequirePermissions('accounting.view_financial_reports')
  trialBalance(@Query() query: AsOfDto) {
    return this.financialReportsService.trialBalance(query);
  }

  @Get('general-ledger')
  @RequirePermissions('accounting.view_financial_reports')
  generalLedger(@Query() query: GeneralLedgerQueryDto) {
    return this.financialReportsService.generalLedger(query);
  }

  @Get('income-statement')
  @RequirePermissions('accounting.view_financial_reports')
  incomeStatement(@Query() query: DateRangeDto) {
    return this.financialReportsService.incomeStatement(query);
  }

  @Get('balance-sheet')
  @RequirePermissions('accounting.view_financial_reports')
  balanceSheet(@Query() query: AsOfDto) {
    return this.financialReportsService.balanceSheet(query);
  }
}
