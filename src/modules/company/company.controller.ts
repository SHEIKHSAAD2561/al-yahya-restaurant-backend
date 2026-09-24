import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CompanyService } from './company.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @RequirePermissions('settings.general_account_setup')
  findOne() {
    return this.companyService.findOrCreate();
  }

  /** Public and permission-free on purpose: just enough to brand the
   * sidebar/favicon (including on the pre-login screen) — not the full
   * record the Settings page edits. */
  @Get('branding')
  @Public()
  async getBranding() {
    const company = await this.companyService.findOrCreate();
    return { name: company.name, logoUrl: company.logoUrl };
  }

  @Patch()
  @RequirePermissions('settings.general_account_setup')
  update(@Body() dto: UpdateCompanyDto) {
    return this.companyService.update(dto);
  }

  @Post('logo')
  @RequirePermissions('settings.general_account_setup')
  @UseInterceptors(
    FileInterceptor('file', {
      // Buffered in memory, not written to disk yet — validated by the pipe
      // below first, so a rejected upload never touches the filesystem.
      storage: memoryStorage(),
      limits: { fileSize: MAX_LOGO_SIZE_BYTES },
    }),
  )
  uploadLogo(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(png|jpe?g|webp|svg\+xml)$/ })
        .addMaxSizeValidator({ maxSize: MAX_LOGO_SIZE_BYTES })
        .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    file: Express.Multer.File,
  ) {
    return this.companyService.saveLogo(file.buffer, file.originalname, file.mimetype);
  }
}
