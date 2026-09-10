import { CareSegmentType } from '@prisma/client';
import { IsArray, IsDateString, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateCareSegmentDto {
  @IsString()
  episodeId!: string;

  @IsEnum(CareSegmentType)
  type!: CareSegmentType;

  @IsString()
  facilityId!: string;

  @IsDateString()
  dateFrom!: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCareSegmentDto {
  @IsOptional()
  @IsEnum(CareSegmentType)
  type?: CareSegmentType;

  @IsOptional()
  @IsString()
  facilityId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProlongCareSegmentDto {
  @IsDateString()
  dateTo!: string;
}

export class CloseCareSegmentDto {
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class TransitionCareSegmentDto {
  @IsEnum(CareSegmentType)
  type!: CareSegmentType;

  @IsString()
  facilityId!: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class DispatchCareSegmentDto {
  @IsOptional()
  @IsArray()
  @IsIn([1, 2], { each: true })
  chats?: Array<1 | 2>;
}
