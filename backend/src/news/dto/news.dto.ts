import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateNewsDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export interface CreateNewsInput {
  title: string;
  summary?: string;
  body: string;
  categoryId?: string | null;
  isPublished: boolean;
}

export interface MediaMeta {
  type: 'video' | 'audio';
  path: string;
  name: string;
  mime: string;
  size: number;
}
