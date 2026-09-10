import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { parseOptionalBoolean } from '../../common/query-boolean';

export class ListEpisodesQueryDto {
  @IsOptional()
  @IsString()
  serviceMemberId?: string;

  @IsOptional()
  @IsEnum(['COMBAT', 'SOMATIC'])
  nature?: 'COMBAT' | 'SOMATIC';

  @IsOptional()
  @Transform(parseOptionalBoolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(parseOptionalBoolean)
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
