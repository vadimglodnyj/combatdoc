import { IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';

export enum EpisodeNature {
  COMBAT = 'COMBAT',
  SOMATIC = 'SOMATIC',
}

export class CreateEpisodeDto {
  @IsString()
  serviceMemberId!: string;

  @IsEnum(EpisodeNature)
  nature!: EpisodeNature;

  @IsString()
  diagnosis!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
