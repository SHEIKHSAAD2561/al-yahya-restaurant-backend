import {
  Body,
  Controller,
  Delete,
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
import { ReceiptSettingsService } from './receipt-settings.service';
import { UpdateReceiptSettingsDto } from './dto/update-receipt-settings.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

@Controller('receipt-settings')
export class ReceiptSettingsController {
  constructor(
    private readonly receiptSettingsService: ReceiptSettingsService,
  ) {}

  @Get()
  @RequirePermissions('pos.manage_sale_settings')
  get() {
    return this.receiptSettingsService.get();
  }

  @Patch()
  @RequirePermissions('pos.manage_sale_settings')
  update(@Body() dto: UpdateReceiptSettingsDto) {
    return this.receiptSettingsService.update(dto);
  }

  @Post('comment-image')
  @RequirePermissions('pos.manage_sale_settings')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
    }),
  )
  uploadCommentImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(png|jpe?g|webp)$/ })
        .addMaxSizeValidator({ maxSize: MAX_IMAGE_SIZE_BYTES })
        .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    file: Express.Multer.File,
  ) {
    return this.receiptSettingsService.uploadCommentImage(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
  }

  @Delete('comment-image')
  @RequirePermissions('pos.manage_sale_settings')
  removeCommentImage() {
    return this.receiptSettingsService.removeCommentImage();
  }
}
