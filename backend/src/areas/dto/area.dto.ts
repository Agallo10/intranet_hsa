import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateAreaDto {
  @IsString()
  name: string;
}

export class UpdateAreaDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
