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
  birthDate?: string;
  phone?: string;
  errors: string[];
  warnings: string[];
}

export interface ImportPreviewResponse {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: ImportRow[];
  duplicates: {
    normalizedName: string;
    existingId?: string;
    count: number;
  }[];
}

export interface ImportApplyRequest {
  rows: number[];
  overwriteExisting: boolean;
}

export interface ImportApplyResponse {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}
