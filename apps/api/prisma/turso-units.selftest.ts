import assert from 'assert';
import {
  canReuseUnit,
  extractUnitLabel,
  makeUnitCode,
  stripRankFromCombined,
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

console.log('turso-units tests passed');
