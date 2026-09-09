export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
}

export enum EpisodeNature {
  COMBAT = 'COMBAT',
  SOMATIC = 'SOMATIC',
}

export enum CareSegmentType {
  HOSP = 'HOSP',
  DAY = 'DAY',
  AMB = 'AMB',
  MPBR = 'MPBR',
  REHAB = 'REHAB',
  ABROAD = 'ABROAD',
  PHYS = 'PHYS',
  VLK_LEAVE = 'VLK_LEAVE',
}

export enum ConsultationKind {
  VISIT = 'VISIT',
  EXAM = 'EXAM',
}

export enum ConsultationStatus {
  PLANNED = 'PLANNED',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum InjuryCertificateStatus {
  MISSING = 'MISSING',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum TaskStatus {
  TODO = 'TODO',
  DOING = 'DOING',
  DONE = 'DONE',
}

export enum JournalEntryType {
  CLINICAL = 'CLINICAL',
  SYSTEM = 'SYSTEM',
}
