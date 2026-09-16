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
  @IsBoolean()
  isPublished?: boolean;
}

export interface CreateNewsInput {
  title: string;
  summary?: string;
  body: string;
  isPublished: boolean;
}
