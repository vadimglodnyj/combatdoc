function formatBirth(raw?: Date | string | null): string {
  if (!raw) return '';
  const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export function formatDispatchLine(input: {
  unitShort?: string | null;
  lastName?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  rankName?: string | null;
  serviceType?: string | null;
  birthDate?: Date | string | null;
  phone?: string | null;
  action: string;
  diagnosis?: string | null;
}): string {
  const pib = [input.lastName, input.firstName, input.middleName].filter(Boolean).join(' ').trim();
  const rankService = [input.rankName, input.serviceType].filter(Boolean).join(' ').trim();
  return [
    input.unitShort,
    pib,
    rankService,
    formatBirth(input.birthDate),
    input.phone,
    input.action,
    input.diagnosis,
  ]
    .map((part) => (part || '').toString().trim())
    .filter(Boolean)
    .join(' · ');
}
