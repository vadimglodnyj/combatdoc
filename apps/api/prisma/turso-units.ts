/** Map Turso dump unit fields onto CombatDOC Unit rows. Pure helpers, no Prisma. */

const RANK_PREFIXES = [
  'молодший лейтенант',
  'старший лейтенант',
  'молодший сержант',
  'старший сержант',
  'майстер-сержант',
  'майстер сержант',
  'головний сержант',
  'штаб-сержант',
  'старший солдат',
  'ст солдат',
  'підполковник',
  'лейтенант',
  'полковник',
  'капітан',
  'сержант',
  'солдат',
  'майор',
];

export function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-zа-яіїєґ0-9]+/gi, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function stripRankFromCombined(rankUnit: string, rank = ''): string {
  let text = rankUnit.trim();
  if (!text) return '';

  const candidates = [rank.trim(), ...RANK_PREFIXES]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  for (const prefix of candidates) {
    const re = new RegExp(`^${escapeRegExp(prefix)}[\\s,;:\\-–—/]*`, 'i');
    if (re.test(text)) {
      text = text.replace(re, '').trim();
      break;
    }
  }
  return text;
}

export function extractUnitLabel(input: {
  unitShort?: string;
  unitName?: string;
  rankUnit?: string;
  rank?: string;
}): string {
  const named = (input.unitName || '').trim();
  if (named) return named;

  const short = (input.unitShort || '').trim();
  const fromCombined = stripRankFromCombined(input.rankUnit || '', input.rank);

  if (short && fromCombined) {
    const shortKey = normalizeKey(short);
    const combinedKey = normalizeKey(fromCombined);
    if (combinedKey && combinedKey !== shortKey && combinedKey.includes(shortKey)) {
      return fromCombined;
    }
    return short;
  }

  return short || fromCombined;
}

export function canReuseUnit(
  dumpLabel: string,
  unit: { code: string; name: string; shortName?: string | null },
): boolean {
  const dumpKey = normalizeKey(dumpLabel);
  if (!dumpKey) return false;
  if (normalizeKey(unit.name) === dumpKey) return true;
  if (unit.shortName && normalizeKey(unit.shortName) === dumpKey) return true;
  return false;
}

export function makeUnitCode(label: string): string {
  const slug = label
    .toUpperCase()
    .replace(/['’`]/g, '')
    .replace(/[^A-ZА-ЯІЇЄҐ0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, 28);
  return `IMP_${slug || 'UNIT'}`;
}

export function uniqueCode(base: string, used: Set<string>): string {
  let code = base;
  let i = 2;
  while (used.has(code)) {
    code = `${base}_${i}`.slice(0, 40);
    i += 1;
  }
  used.add(code);
  return code;
}
