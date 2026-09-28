import { Controller, Get } from '@nestjs/common';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('accounting')
export class AccountingSetupGuideController {
  constructor(private readonly chartOfAccountsService: ChartOfAccountsService) {}

  @Get('setup-guide')
  @RequirePermissions('accounting.view_setup_guide')
  getSetupGuide() {
    return this.chartOfAccountsService.getSetupGuide();
  }
}
