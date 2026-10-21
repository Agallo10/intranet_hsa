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
  code?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  elaborationDate?: string;

  @IsOptional()
  @IsString()
  updateDate?: string;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  areaId?: string | null;

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
  code?: string | null;
  version?: string | null;
  elaborationDate?: string | null;
  updateDate?: string | null;
  type: ContentType;
  categoryId?: string | null;
  areaId?: string | null;
  cursoId?: string | null;
  position?: number;
  embedUrl?: string | null;
  isPublished: boolean;
}
