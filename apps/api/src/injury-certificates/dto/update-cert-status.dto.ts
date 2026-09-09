import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum InjuryCertificateStatus {
  MISSING = 'MISSING',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export class UpdateCertStatusDto {
  @IsEnum(InjuryCertificateStatus)
  status!: InjuryCertificateStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
