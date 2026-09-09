import {
  UserRole,
  EpisodeNature,
  CareSegmentType,
  ConsultationKind,
  ConsultationStatus,
  InjuryCertificateStatus,
  TaskStatus,
} from './enums';

export interface CreateUserDto {
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
  };
}

export interface ServiceMemberDto {
  id?: string;
  lastName: string;
  firstName: string;
  middleName: string;
  rankId: string;
  unitId: string;
  serviceType: string;
  fullPosition: string;
  unitShortName?: string;
  birthDate?: Date;
  phone?: string;
  taxId?: string;
  recruitmentOffice?: string;
  recruitmentDate?: Date;
  educationLevel?: string;
  educationInstitution?: string;
  educationPlace?: string;
  educationYear?: number;
}

export interface EpisodeDto {
  id?: string;
  serviceMemberId: string;
  nature: EpisodeNature;
  diagnosis: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  continuousDays120?: number;
}

export interface ConsultationDto {
  id?: string;
  episodeId: string;
  kind: ConsultationKind;
  status: ConsultationStatus;
  facilityId: string;
  practitionerRoleId: string;
  scheduledDate?: Date;
  completedDate?: Date;
  notes?: string;
}

export interface CareSegmentDto {
  id?: string;
  episodeId: string;
  type: CareSegmentType;
  dateFrom: Date;
  dateTo?: Date;
  facilityId: string;
  documentNumber?: string;
  diagnosis?: string;
  notes?: string;
  whatsappStatus?: string;
}

export interface InjuryCertificateDto {
  id?: string;
  episodeId: string;
  status: InjuryCertificateStatus;
  uploadDate?: Date;
  verifiedDate?: Date;
  rejectionReason?: string;
  filePath?: string;
}

export interface TaskDto {
  id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assigneeId?: string;
  dueDate?: Date;
  patientId?: string;
}
