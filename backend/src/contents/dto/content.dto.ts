import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { ContentType } from '../../common/content-type.enum.js';

// Las peticiones multipart (por ejemplo al reemplazar un archivo) envían los
// campos como texto, así que normalizamos los no textuales antes de validar.
const toBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
};

const toOptionalInt = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return Number(value);
};

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
  @Transform(toBoolean)
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @Transform(toOptionalInt)
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
