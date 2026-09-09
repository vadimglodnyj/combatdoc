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
  nature: 'COMBAT' | 'SOMATIC';
  diagnosis: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
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
