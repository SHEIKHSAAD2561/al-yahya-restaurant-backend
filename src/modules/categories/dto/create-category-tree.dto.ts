import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CategoryTreeNodeDto } from './category-tree-node.dto';

/**
 * "Category tree": define a whole branch at once. `parentName` finds an
 * existing top-level category with that name to extend, or creates a new
 * top-level one — either way it's level 1; `children` (level 2) and their own
 * `children` (level 3) are always newly created. Deeper nesting is rejected
 * (MAX_CATEGORY_DEPTH in categories.service.ts).
 */
export class CreateCategoryTreeDto {
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @MaxLength(100)
  parentName: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CategoryTreeNodeDto)
  children?: CategoryTreeNodeDto[];
}
