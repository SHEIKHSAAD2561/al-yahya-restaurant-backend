import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ReceiptLanguage, ReceiptPrintLayout } from '../receipt-settings.enums';

const boolField = () =>
  IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') });

export class UpdateReceiptSettingsDto {
  @boolField() showLogo: boolean;
  @boolField() showCompanyName: boolean;
  @boolField() showCompanyAddress: boolean;
  @boolField() showCompanyPhone: boolean;
  @boolField() showVatNumber: boolean;
  @boolField() showCrNumber: boolean;

  @boolField() showSku: boolean;
  @boolField() showBarcode: boolean;
  @boolField() showQuantity: boolean;
  @boolField() showUnitPrice: boolean;
  @boolField() showDiscount: boolean;
  @boolField() showTaxPerLine: boolean;

  @boolField() showSubtotal: boolean;
  @boolField() showTaxSummary: boolean;
  @boolField() showTotal: boolean;
  @boolField() showAmountPaid: boolean;
  @boolField() showChangeDue: boolean;
  @boolField() showPaymentMethod: boolean;
  @boolField() showCashierName: boolean;
  @boolField() showCustomerName: boolean;
  @boolField() showQrCode: boolean;
  @boolField() showThankYouNote: boolean;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(500)
  salesNote?: string | null;

  @IsEnum(ReceiptPrintLayout, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  printLayout: ReceiptPrintLayout;

  @IsEnum(ReceiptLanguage, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  language: ReceiptLanguage;
}
