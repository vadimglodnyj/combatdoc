import { IsDateString, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ConsultationOutcomeDto {
  @IsEnum(['NONE', 'CONSULTATION', 'EXAM', 'CARE_SEGMENT'])
  kind!: 'NONE' | 'CONSULTATION' | 'EXAM' | 'CARE_SEGMENT';

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  facilityId?: string;

  @IsOptional()
  @IsString()
  practitionerRoleId?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateConsultationDto {
  @IsString()
  episodeId!: string;

  @IsEnum(['VISIT', 'EXAM'])
  kind!: 'VISIT' | 'EXAM';

  @IsOptional()
  @IsEnum(['PLANNED', 'DONE', 'CANCELLED'])
  status?: 'PLANNED' | 'DONE' | 'CANCELLED';

  @IsString()
  facilityId!: string;

  @IsString()
  practitionerRoleId!: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsDateString()
  completedDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ConsultationOutcomeDto)
  outcome?: ConsultationOutcomeDto;
}

export class UpdateConsultationDto {
  @IsOptional()
  @IsEnum(['VISIT', 'EXAM'])
  kind?: 'VISIT' | 'EXAM';

  @IsOptional()
  @IsEnum(['PLANNED', 'DONE', 'CANCELLED'])
  status?: 'PLANNED' | 'DONE' | 'CANCELLED';

  @IsOptional()
  @IsString()
  facilityId?: string;

  @IsOptional()
  @IsString()
  practitionerRoleId?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsDateString()
  completedDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ConsultationOutcomeDto)
  outcome?: ConsultationOutcomeDto;
}
