import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { JournalEntriesService } from './journal-entries.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { QueryJournalEntriesDto } from './dto/query-journal-entries.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/authenticated-request';

@Controller('journal-entries')
export class JournalEntriesController {
  constructor(private readonly journalEntriesService: JournalEntriesService) {}

  @Get()
  @RequirePermissions('accounting.access')
  findAll(@Query() query: QueryJournalEntriesDto) {
    return this.journalEntriesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('accounting.access')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.journalEntriesService.findOneOrFail(id);
  }

  @Post()
  @RequirePermissions('accounting.record_journal_entries')
  create(@Body() dto: CreateJournalEntryDto, @CurrentUser() user: RequestUser) {
    return this.journalEntriesService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions('accounting.manage_journal_entries')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateJournalEntryDto) {
    return this.journalEntriesService.update(id, dto);
  }

  @Post(':id/post')
  @RequirePermissions('accounting.record_journal_entries')
  post(@Param('id', ParseUUIDPipe) id: string) {
    return this.journalEntriesService.post(id);
  }

  @Post(':id/reverse')
  @RequirePermissions('accounting.manage_journal_entries')
  reverse(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    return this.journalEntriesService.reverse(id, user);
  }

  @Delete(':id')
  @RequirePermissions('accounting.manage_journal_entries')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.journalEntriesService.remove(id);
  }
}
