export const CARE_SEGMENT_LABELS: Record<string, string> = {
  HOSP: 'Стаціонар',
  DAY: 'Денний стаціонар',
  AMB: 'Поліклініка',
  MPBR: 'МПБр',
  REHAB: 'Реабілітація',
  ABROAD: 'За кордоном',
  PHYS: 'Звільнення за фіз.',
  VLK_LEAVE: 'Відпустка ВЛК',
};

export const CONSULTATION_KIND_LABELS: Record<string, string> = {
  VISIT: 'Візит',
  EXAM: 'Обстеження',
};

export const CONSULTATION_STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Заплановано',
  DONE: 'Виконано',
  CANCELLED: 'Скасовано',
};

export function careSegmentLabel(type?: string | null): string {
  if (!type) return '—';
  return CARE_SEGMENT_LABELS[type] || type;
}

export function consultationKindLabel(kind?: string | null): string {
  if (!kind) return '—';
  return CONSULTATION_KIND_LABELS[kind] || kind;
}

export function consultationStatusLabel(status?: string | null): string {
  if (!status) return '—';
  return CONSULTATION_STATUS_LABELS[status] || status;
}

export function consultationStatusColor(status?: string | null): string {
  switch (status) {
    case 'DONE':
      return 'green';
    case 'PLANNED':
      return 'gold';
    case 'CANCELLED':
      return 'default';
    default:
      return 'blue';
  }
}

export function looksLikeConsultationTitle(title?: string | null): boolean {
  return /консультац|огляд|направл|\bмпб\b|referral|consult|exam/i.test(title || '');
}

export function segmentTypeFromTitle(title?: string | null): string | null {
  const text = (title || '').toLowerCase();
  if (/влк|відпуст/.test(text)) return 'VLK_LEAVE';
  if (/стаціон|госпітал|лікарн/.test(text)) return 'HOSP';
  if (/реабіл/.test(text)) return 'REHAB';
  if (/поліклін|амбулатор/.test(text)) return 'AMB';
  if (/мпбр/.test(text)) return 'MPBR';
  return null;
}

