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

/**
 * Words that mark a string as a POSITION (посада), not a unit (підрозділ).
 * The Turso dump sometimes stores the full job title in the unit field, which
 * previously polluted the unit dictionary (e.g. "Водій-електрик … взвод зв'язку
 * … 2-го батальйону оперативного призначення").
 */
const POSITION_RE =
  /водій|електрик|начальник|командир|майстер|гранатометник|радіотелеграфіст|радіостанц|спеціаліст|техн[іи]к|механік|помічник|стрілець|снайпер|розпорядженн|обслуг|оператор|санітар|фельдшер|сапер|кулеметник|розвідник|діловод|писар|каптенармус|старшина|номер\s|заступник/i;

export function looksLikePosition(text: string): boolean {
  return POSITION_RE.test(text || '');
}

/** Collapse variants of the same unit code: "1РОП" / "1 РОП" / "1-ї роп" -> "1 РОП". */
export function canonicalUnitCode(value: string): string {
  const text = (value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const rop = text.match(/(\d+)\s*-?\s*[а-яії]*\s*роп(?![а-яіїєґ0-9])/i);
  if (rop) return `${rop[1]} РОП`;
  const bop = text.match(/(\d+)\s*-?\s*[а-яії]*\s*боп(?![а-яіїєґ0-9])/i);
  if (bop) return `${bop[1]} БОП`;
  return text;
}

/**
 * Try to recover a real unit code from an arbitrary string (often a position).
 * Order of preference: explicit trailing code in parentheses -> company
 * ("N-ї роти оперативного" -> "N РОП") -> battalion ("N-го батальйону" ->
 * "N БОП") -> a compact standalone code ("1РОП"). Returns '' when nothing
 * unit-like is present.
 */
export function unitCodeFromText(text: string): string {
  const src = (text || '').trim();
  if (!src) return '';

  // 1. Code in parentheses, e.g. "... (1РОП)" or "... (2 боп 1 роп бтр)".
  const parens = [...src.matchAll(/\(([^()]+)\)/g)]
    .map((m) => m[1])
    .filter((p) => /роп|боп|\bбат/i.test(p));
  if (parens.length) return canonicalUnitCode(parens[parens.length - 1]);

  // 2. Company: "N-ї/N-ої роти оперативного (призначення)" -> "N РОП".
  const company = src.match(/(\d+)\s*-?\s*[а-яії]*\s*рот[аиі]\s+оперативн/i);
  if (company) return `${company[1]} РОП`;

  // 3. Battalion: "N-го батальйону" -> "N БОП".
  const battalion = src.match(/(\d+)\s*-?\s*[а-яії]*\s*батальйон/i);
  if (battalion) return `${battalion[1]} БОП`;

  // 4. Compact standalone code on a short, non-position label: "1РОП".
  const compact = src.match(/^(\d+)\s*роп$/i);
  if (compact) return `${compact[1]} РОП`;

  return '';
}

export function extractUnitLabel(input: {
  unitShort?: string;
  unitName?: string;
  rankUnit?: string;
  rank?: string;
}): string {
  const short = (input.unitShort || '').trim();
  const named = (input.unitName || '').trim();
  const fromCombined = stripRankFromCombined(input.rankUnit || '', input.rank);

  // 1. Recover a real unit code from any field. This rescues positions that
  // embed their unit (e.g. "... 2-го батальйону ..." -> "2 БОП", "... (1РОП)").
  for (const source of [short, named, fromCombined]) {
    const code = unitCodeFromText(source);
    if (code) return code;
  }

  // 2. Otherwise fall back to the best plain unit name (previous behaviour).
  let label: string;
  if (named) {
    label = named;
  } else if (short && fromCombined) {
    const shortKey = normalizeKey(short);
    const combinedKey = normalizeKey(fromCombined);
    label =
      combinedKey && combinedKey !== shortKey && combinedKey.includes(shortKey)
        ? fromCombined
        : short;
  } else {
    label = short || fromCombined;
  }

  // 3. Never let a raw position become a unit — send it to the default unit.
  if (label && looksLikePosition(label)) return '';

  return canonicalUnitCode(label);
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
