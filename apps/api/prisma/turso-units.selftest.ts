import assert from 'assert';
import {
  canReuseUnit,
  canonicalUnitCode,
  extractUnitLabel,
  looksLikePosition,
  makeUnitCode,
  stripRankFromCombined,
  unitCodeFromText,
} from './turso-units';

const seedU1 = { code: 'U1', name: 'Підрозділ 1', shortName: 'Підр-1' };

assert.equal(extractUnitLabel({ unitShort: '1', rank: 'Солдат' }), '1');
assert.equal(
  extractUnitLabel({
    unitShort: '1',
    rankUnit: 'Солдат 1 механізована рота',
    rank: 'Солдат',
  }),
  '1 механізована рота',
);
assert.equal(extractUnitLabel({ unitShort: '1 МР' }), '1 МР');
assert.equal(
  extractUnitLabel({ unitShort: '', rankUnit: 'Сержант штаб', rank: 'Сержант' }),
  'штаб',
);
assert.equal(
  extractUnitLabel({ unitName: 'Медична рота', unitShort: '1' }),
  'Медична рота',
);
assert.equal(stripRankFromCombined('Солдат, 2 рота', 'Солдат'), '2 рота');

assert.equal(canReuseUnit('1', seedU1), false);
assert.equal(canReuseUnit('1 рота', seedU1), false);
assert.equal(canReuseUnit('Підрозділ 1', seedU1), true);
assert.equal(canReuseUnit('Підр-1', seedU1), true);
assert.equal(makeUnitCode('1 МР'), 'IMP_1_МР');

// --- Positions must NOT pollute the unit dictionary (real dump examples) ---

// Clean short codes are preserved (and normalised).
assert.equal(extractUnitLabel({ unitShort: 'ІСВ' }), 'ІСВ');
assert.equal(extractUnitLabel({ unitShort: 'МП' }), 'МП');
assert.equal(extractUnitLabel({ unitShort: 'УБ' }), 'УБ');
assert.equal(extractUnitLabel({ unitShort: '1РОП' }), '1 РОП');
assert.equal(extractUnitLabel({ unitShort: '2 РОП' }), '2 РОП');
// Caliber in parentheses is not a unit code.
assert.equal(extractUnitLabel({ unitShort: 'МБ (120мм)' }), 'МБ (120мм)');

// Positions with a battalion recover "N БОП".
assert.equal(
  extractUnitLabel({
    unitName:
      "Водій-електрик групої радіозв'язку взвод зв'язку 2-го батальйону оперативного призначення",
  }),
  '2 БОП',
);
assert.equal(
  extractUnitLabel({
    unitName:
      "Начальник групи групої радіозв'язку взвод зв'язку 2-го батальйону оперативного призначення",
  }),
  '2 БОП',
);

// Positions with an explicit code in parentheses win.
assert.equal(
  extractUnitLabel({
    unitName:
      'Командир взводу 1-го взводу оперативного призначення 1-ої роти оперативного призначення (на бронетранспортерах) 2-го батальйону оперативного призначення (1РОП)',
  }),
  '1 РОП',
);
assert.equal(
  extractUnitLabel({
    unitName: 'У розпорядженні командира військової частини (1РОП)',
  }),
  '1 РОП',
);
assert.equal(
  extractUnitLabel({
    unitName: 'У розпорядженні командира військової частини (2 боп 1 роп бтр)',
  }),
  '1 РОП',
);

// Company ("N-ї роти оперативного") is preferred over the battalion.
assert.equal(
  extractUnitLabel({
    unitName:
      'Гранатометник 2-го взводу оперативного призначення 3-ої роти оперативного призначення (на бронетранспортерах) 1-го батальйону оперативного призначення',
  }),
  '3 РОП',
);

// A pure position with no derivable unit falls back to '' (-> default unit).
assert.equal(
  extractUnitLabel({ unitName: 'У розпорядженні командира військової частини' }),
  '',
);

// Helper-level checks.
assert.equal(looksLikePosition('Водій-електрик групої радіозв\u2019язку'), true);
assert.equal(looksLikePosition('1 РОП'), false);
assert.equal(unitCodeFromText('… 2-го батальйону оперативного призначення'), '2 БОП');
assert.equal(unitCodeFromText('ІСВ'), '');
assert.equal(canonicalUnitCode('1РОП'), '1 РОП');
assert.equal(canonicalUnitCode('Медична рота'), 'Медична рота');

console.log('turso-units tests passed');
