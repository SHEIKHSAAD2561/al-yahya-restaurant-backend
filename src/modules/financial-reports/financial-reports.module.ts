import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../chart-of-accounts/account.entity';
import { JournalEntryLine } from '../journal-entries/entities/journal-entry-line.entity';
import { FinancialReportsController } from './financial-reports.controller';
import { FinancialReportsService } from './financial-reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([Account, JournalEntryLine])],
  controllers: [FinancialReportsController],
  providers: [FinancialReportsService],
})
export class FinancialReportsModule {}
