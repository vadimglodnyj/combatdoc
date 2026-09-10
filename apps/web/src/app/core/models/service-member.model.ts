export interface Rank {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
}

export interface Unit {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  sortOrder: number;
}

export interface Episode {
  id: string;
  serviceMemberId: string;
  diagnosis: string;
  startDate: string;
  endDate?: string;
  nature: 'COMBAT' | 'SOMATIC';
  isActive: boolean;
  continuousDays120: number;
  serviceMember?: ServiceMember;
  injuryCertificate?: InjuryCertificate;
  consultations?: any[];
  careSegments?: any[];
  paymentBlockedByCert?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InjuryCertificate {
  id: string;
  episodeId: string;
  status: 'MISSING' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  uploadDate?: string;
  verifiedDate?: string;
  rejectionReason?: string;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEpisodeDto {
  serviceMemberId: string;
  nature: 'COMBAT' | 'SOMATIC';
  diagnosis: string;
  startDate: string;
  endDate?: string;
}

export interface UpdateEpisodeDto {
  diagnosis?: string;
  startDate?: string;
  endDate?: string;
}

export interface ServiceMemberPage {
  items: ServiceMember[];
  total: number;
  page: number;
  take: number;
}

export interface ServiceMember {
  id: string;
  lastName: string;
  firstName: string;
  middleName: string;
  rankId: string;
  unitId: string;
  serviceType: string;
  fullPosition: string;
  unitShortName?: string;
  birthDate?: string;
  phone?: string;
  taxId?: string;
  recruitmentOffice?: string;
  recruitmentDate?: string;
  educationLevel?: string;
  educationInstitution?: string;
  educationPlace?: string;
  educationYear?: number;
  createdAt: string;
  updatedAt: string;
  rank?: Rank;
  unit?: Unit;
  episodes?: Episode[];
}

export interface CreateServiceMemberDto {
  lastName: string;
  firstName: string;
  middleName: string;
  rankId: string;
  unitId: string;
  serviceType: string;
  fullPosition: string;
  unitShortName?: string;
  birthDate?: string;
  phone?: string;
  taxId?: string;
  recruitmentOffice?: string;
  recruitmentDate?: string;
  educationLevel?: string;
  educationInstitution?: string;
  educationPlace?: string;
  educationYear?: number;
}

export interface ImportRow {
  rowNumber: number;
  lastName: string;
  firstName: string;
  middleName: string;
  unit?: string;
  position?: string;
  rankStaff?: string;
  rankActual?: string;
  serviceType?: string;
  unitShort?: string;
  errors: string[];
  warnings: string[];
}

export interface ImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: ImportRow[];
  duplicates: Array<{
    normalizedName: string;
    count: number;
  }>;
}
