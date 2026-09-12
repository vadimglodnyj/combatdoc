/**
 * Canonical unit dictionary for в/ч 3029 / 2-й БОП, derived from the штат
 * ("Підрозділ (скорочено)" column of База_2_БОП). These are the real
 * rota-/platoon-level subunits that must stay separate. Pure helpers, no Prisma.
 */
import { normalizeKey } from './turso-units';

export interface CanonicalUnit {
  code: string; // stable unique code for the units table
  short: string; // short label shown in the UI ("Підрозділ (скорочено)")
  name: string; // full official name ("Підрозділ 3")
}

export const BOP2_UNITS: CanonicalUnit[] = [
  { code: '2BOP_1ROP', short: '1РОП', name: '1-ша рота оперативного призначення (на бронетранспортерах)' },
  { code: '2BOP_2ROP', short: '2РОП', name: '2-га рота оперативного призначення (на бронетранспортерах)' },
  { code: '2BOP_3ROP', short: '3РОП', name: '3-тя рота оперативного призначення (на бронетранспортерах)' },
  { code: '2BOP_RVP', short: 'РВП', name: 'Рота вогневої підтримки' },
  { code: '2BOP_RVSP', short: 'РВСП', name: 'Розвідувальний взвод спеціального призначення' },
  { code: '2BOP_VZ', short: 'ВЗ', name: "Взвод зв'язку" },
  { code: '2BOP_VBKSP', short: 'ВБКСП', name: 'Взвод безпілотних комплексів спеціального призначення' },
  { code: '2BOP_VMTZ', short: 'ВМТЗ', name: 'Взвод матеріально-технічного забезпечення' },
  { code: '2BOP_VTOOVT', short: 'ВТООтаВТ', name: 'Взвод технічного обслуговування озброєння та військової техніки' },
  { code: '2BOP_MB120', short: 'МБ (120мм)', name: 'Мінометна батарея (120 мм міномети)' },
  { code: '2BOP_MB60', short: 'МБ (60мм, 82мм)', name: 'Мінометна батарея (60 мм (82 мм) міномети)' },
  { code: '2BOP_MP', short: 'МП', name: 'Медичний пункт' },
  { code: '2BOP_ISV', short: 'ІСВ', name: 'Інженерно-саперне відділення' },
  { code: '2BOP_SHB', short: 'ШБ', name: 'Штаб' },
  { code: '2BOP_UB', short: 'УБ', name: 'Управління батальйону' },
];

const BY_SHORT = new Map(BOP2_UNITS.map((u) => [normalizeKey(u.short), u]));

export function unitByShort(short: string): CanonicalUnit | undefined {
  return BY_SHORT.get(normalizeKey(short));
}

/**
 * Resolve any free-text unit/position string onto a canonical short code, or
 * null when nothing recognisable is present. Specific subunit keywords win over
 * the battalion, so a "взвод зв'язку 2-го батальйону" position becomes ВЗ (not
 * a battalion bucket).
 */
export function resolveUnitShort(...parts: string[]): string | null {
  const raw = parts.filter(Boolean);
  const n = normalizeKey(raw.join(' '));
  if (!n) return null;

  // 1. Exact short code already present in any field (e.g. unit_short = "ВЗ").
  for (const part of raw) {
    const hit = BY_SHORT.get(normalizeKey(part));
    if (hit) return hit.short;
  }

  // 2. Rota of operational purpose -> "NРОП" (also compact "1роп").
  const ropByName = n.match(/(\d)\s*[а-яії]{0,4}\s*рот[аиі]\s+операт/);
  const ropCompact = n.match(/(?:^|[^0-9])(\d)\s*роп(?![а-яії0-9])/);
  const ropNum = ropByName?.[1] || ropCompact?.[1];
  if (ropNum && ['1', '2', '3'].includes(ropNum)) return `${ropNum}РОП`;

  // 3. Keyword matchers, most specific first.
  if (n.includes('безпілотн')) return 'ВБКСП';
  if (/звязку|радіотелеграф|телекомунікац/.test(n)) return 'ВЗ';
  if (n.includes('матеріально')) return 'ВМТЗ';
  if (n.includes('обслуговування озброєння')) return 'ВТООтаВТ';
  if (/вогневої підтримки|гранатометний взвод|кулеметний взвод|протитанковий взвод/.test(n)) return 'РВП';
  if (n.includes('розвідувальн')) return 'РВСП';
  if (n.includes('мінометн') || n.includes('міномет')) {
    if (n.includes('120')) return 'МБ (120мм)';
    if (/60|82/.test(n)) return 'МБ (60мм, 82мм)';
    return 'МБ (120мм)';
  }
  if (n.includes('медичний пункт') || n.includes('медпункт') || /(^|\s)медп(\s|$)/.test(n)) return 'МП';
  if (/інженерно саперн|саперн/.test(n)) return 'ІСВ';
  if (/командир батальйону|заступник командира батальйону|управління батальйону/.test(n)) return 'УБ';
  if (n.includes('штаб')) return 'ШБ';

  return null;
}

export function resolveUnit(...parts: string[]): CanonicalUnit | null {
  const short = resolveUnitShort(...parts);
  return short ? unitByShort(short) ?? { code: `IMP_${short}`, short, name: short } : null;
}
