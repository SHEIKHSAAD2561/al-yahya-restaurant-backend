import { IsDateString, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RecordDepreciationDto {
  /** Which period this run covers — typically a month-end date. */
  @IsDateString({}, { message: i18nValidationMessage('validation.IS_STRING') })
  periodDate: string;

  /** Defaults to the straight-line monthly amount, capped so accumulated
   * depreciation never exceeds `purchaseCost − salvageValue`. Override only
   * for a partial-period or manually-adjusted run. */
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(0.01, { message: i18nValidationMessage('validation.MIN') })
  @Max(99_999_999, { message: i18nValidationMessage('validation.MAX') })
  amount?: number;
}
