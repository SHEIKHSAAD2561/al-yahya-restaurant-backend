import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { ChartOfAccountsController } from './chart-of-accounts.controller';
import { AccountingSetupGuideController } from './accounting-setup-guide.controller';
import { ChartOfAccountsService } from './chart-of-accounts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  controllers: [ChartOfAccountsController, AccountingSetupGuideController],
  providers: [ChartOfAccountsService],
})
export class ChartOfAccountsModule {}
