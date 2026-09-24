import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { ContentType } from '../../common/content-type.enum.js';

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsInt()
  position?: number;
}

export interface CreateContentInput {
  title: string;
  description?: string;
  type: ContentType;
  categoryId?: string | null;
  cursoId?: string | null;
  position?: number;
  embedUrl?: string | null;
  isPublished: boolean;
}
