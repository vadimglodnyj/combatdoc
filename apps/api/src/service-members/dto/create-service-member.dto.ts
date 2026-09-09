import { IsString, IsOptional, IsDateString, IsInt, MinLength } from 'class-validator';

export class CreateServiceMemberDto {
  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  middleName!: string;

  @IsString()
  rankId!: string;

  @IsString()
  unitId!: string;

  @IsString()
  serviceType!: string;

  @IsString()
  fullPosition!: string;

  @IsString()
  @IsOptional()
  unitShortName?: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsString()
  @IsOptional()
  recruitmentOffice?: string;

  @IsDateString()
  @IsOptional()
  recruitmentDate?: string;

  @IsString()
  @IsOptional()
  educationLevel?: string;

  @IsString()
  @IsOptional()
  educationInstitution?: string;

  @IsString()
  @IsOptional()
  educationPlace?: string;

  @IsInt()
  @IsOptional()
  educationYear?: number;
}
