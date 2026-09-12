import assert from 'assert';
import { BOP2_UNITS, resolveUnit, resolveUnitShort } from './unit-dictionary';

// Full official names (Підрозділ 3) resolve to their canonical short code.
const nameCases: Array<[string, string]> = [
  ['1-ша рота оперативного призначення (на бронетранспортерах)', '1РОП'],
  ['2-га рота оперативного призначення (на бронетранспортерах)', '2РОП'],
  ['3-тя рота оперативного призначення (на бронетранспортерах)', '3РОП'],
  ['Рота вогневої підтримки', 'РВП'],
  ['Розвідувальний взвод спеціального призначення', 'РВСП'],
  ["Взвод зв'язку", 'ВЗ'],
  ['Взвод безпілотних комплексів спеціального призначення', 'ВБКСП'],
  ['Взвод матеріально-технічного забезпечення', 'ВМТЗ'],
  ['Взвод технічного обслуговування озброєння та військової техніки', 'ВТООтаВТ'],
  ['Мінометна батарея (120 мм міномети)', 'МБ (120мм)'],
  ['Мінометна батарея (60 мм (82 мм) міномети)', 'МБ (60мм, 82мм)'],
  ['Медичний пункт', 'МП'],
  ['Інженерно-саперне відділення', 'ІСВ'],
  ['Штаб', 'ШБ'],
];
for (const [text, code] of nameCases) {
  assert.equal(resolveUnitShort(text), code, `name "${text}" -> ${code}`);
}

// Real position strings from the Turso dump map to the correct SUBUNIT,
// not the battalion. This is the key fix.
assert.equal(
  resolveUnitShort(
    "Водій-електрик групої радіозв'язку взвод зв'язку 2-го батальйону оперативного призначення",
  ),
  'ВЗ',
);
assert.equal(
  resolveUnitShort(
    "Начальник радіостанції групої радіозв'язку взвод зв'язку 2-го батальйону оперативного призначення",
  ),
  'ВЗ',
);
assert.equal(
  resolveUnitShort(
    'Гранатометник 2-го взводу оперативного призначення 3-ої роти оперативного призначення (на бронетранспортерах) 1-го батальйону оперативного призначення',
  ),
  '3РОП',
);
assert.equal(
  resolveUnitShort('Командир взводу ... 1-ої роти оперативного призначення (1РОП)'),
  '1РОП',
);
assert.equal(resolveUnitShort('У розпорядженні командира військової частини (2 боп 1 роп бтр)'), '1РОП');

// Explicit short codes are preserved (unit_short = "ВЗ" / "РВСП" / "МБ (120мм)").
assert.equal(resolveUnitShort('ВЗ'), 'ВЗ');
assert.equal(resolveUnitShort('РВСП'), 'РВСП');
assert.equal(resolveUnitShort('РВП'), 'РВП');
assert.equal(resolveUnitShort('МБ (120мм)'), 'МБ (120мм)');

// HQ positions resolve to Управління / Штаб.
assert.equal(resolveUnitShort('Командир батальйону'), 'УБ');
assert.equal(resolveUnitShort('Начальник штабу'), 'ШБ');

// Unknown / non-2БОП text does not force a wrong match (-> default unit later).
assert.equal(resolveUnitShort('У розпорядженні командира військової частини'), null);
assert.equal(resolveUnitShort('1 механізована рота'), null);
assert.equal(resolveUnitShort(''), null);

// resolveUnit returns the full official name for a matched code.
const vz = resolveUnit("взвод зв'язку 2-го батальйону оперативного призначення");
assert.equal(vz?.short, 'ВЗ');
assert.equal(vz?.name, "Взвод зв'язку");

assert.equal(BOP2_UNITS.length, 15);

console.log('unit-dictionary tests passed');
