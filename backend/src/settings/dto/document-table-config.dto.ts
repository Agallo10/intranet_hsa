import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class UpdateDocumentTableConfigDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  columns: string[];
}
