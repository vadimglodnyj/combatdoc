export function formatUnitLabel(
  unit?: { name?: string | null; shortName?: string | null } | null,
  unitShortName?: string | null,
): string {
  const name = (unit?.name || '').trim();
  const short = (unitShortName || unit?.shortName || '').trim();
  if (name && short && name.toLowerCase() !== short.toLowerCase()) {
    return `${name} (${short})`;
  }
  return name || short || '—';
}
