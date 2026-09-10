import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { parseOptionalBoolean } from '../../common/query-boolean';

export class ListClinicalQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  episodeId?: string;

  @IsOptional()
  @IsString()
  serviceMemberId?: string;

  @IsOptional()
  @IsEnum(['VISIT', 'EXAM'])
  kind?: 'VISIT' | 'EXAM';

  @IsOptional()
  @IsEnum(['PLANNED', 'DONE', 'CANCELLED'])
  status?: 'PLANNED' | 'DONE' | 'CANCELLED';

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @Transform(parseOptionalBoolean)
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  onDate?: string;

  @IsOptional()
  @Transform(parseOptionalBoolean)
  @IsBoolean()
  includeUnscheduled?: boolean;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === '' ? undefined : parseInt(value, 10)))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === '' ? undefined : parseInt(value, 10)))
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}
