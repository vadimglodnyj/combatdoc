import { CareSegmentType } from '@prisma/client';
import { normalizeKey } from './turso-units';

export type CareMapping = CareSegmentType | 'CONSULTATION' | 'SKIP';

const CARE_MAP: Record<string, CareMapping> = {
  inpatient: 'HOSP',
  hosp: 'HOSP',
  hospital: 'HOSP',
  day_hospital: 'DAY',
  day: 'DAY',
  outpatient: 'AMB',
  amb: 'AMB',
  rehab: 'REHAB',
  abroad: 'ABROAD',
  mpbr: 'MPBR',
  mpb: 'CONSULTATION',
  phys_exempt: 'PHYS',
  phys: 'PHYS',
  vlk: 'VLK_LEAVE',
  vlk_leave: 'VLK_LEAVE',
  vacation: 'VLK_LEAVE',
  leave: 'VLK_LEAVE',
  referral: 'CONSULTATION',
  consultation: 'CONSULTATION',
  consult: 'CONSULTATION',
  exam: 'CONSULTATION',
  visit: 'CONSULTATION',
};

export function mapCare(raw: string): CareMapping {
  const text = normalizeKey(raw);
  if (!text) return 'CONSULTATION';
  const key = text.replace(/\s/g, '_');
  if (CARE_MAP[key]) return CARE_MAP[key];
  if (CARE_MAP[raw.toLowerCase().trim()]) return CARE_MAP[raw.toLowerCase().trim()];
  if (/консультац|огляд|направл|мпб|referral|consult|exam|візит/.test(text)) return 'CONSULTATION';
  if (/стаціон|госпітал|лікарн|inpatient|hosp/.test(text)) return 'HOSP';
  if (/денн/.test(text) && /стаціон|hosp/.test(text)) return 'DAY';
  if (/поліклін|амбулатор|outpatient/.test(text)) return 'AMB';
  if (/реабіл|rehab/.test(text)) return 'REHAB';
  if (/закордон|за кордон|abroad/.test(text)) return 'ABROAD';
  if (/мпбр|mpbr/.test(text)) return 'MPBR';
  if (/фіз|phys/.test(text)) return 'PHYS';
  if (/влк|відпуст|vacation|leave/.test(text)) return 'VLK_LEAVE';
  return 'CONSULTATION';
}

export function looksLikeConsultation(title: string): boolean {
  const text = normalizeKey(title);
  return /консультац|огляд|направл|\bмпб\b|referral|consult|exam/.test(text);
}

/** Calendar day in local TZ so 09.09 00:00 and 09.09 10:00 collapse together. */
export function dayKey(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function segmentDedupeKey(input: {
  episodeId: string;
  type: string;
  dateFrom: Date | string;
  dateTo?: Date | string | null;
}): string {
  return [
    input.episodeId,
    input.type,
    dayKey(input.dateFrom),
    input.dateTo ? dayKey(input.dateTo) : 'open',
  ].join('|');
}

