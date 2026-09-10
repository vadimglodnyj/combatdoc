import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListEpisodesQueryDto {
  @IsOptional()
  @IsString()
  serviceMemberId?: string;

  @IsOptional()
  @IsEnum(['COMBAT', 'SOMATIC'])
  nature?: 'COMBAT' | 'SOMATIC';

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  missingCert?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  skip?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  take?: number;
}
