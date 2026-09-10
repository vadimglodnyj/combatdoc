import assert from 'assert';
import { parseDump } from './turso-sql';
import { extractUnitLabel } from './turso-units';

const sample = `
CREATE TABLE patients (
  id INTEGER PRIMARY KEY,
  pib TEXT NOT NULL,
  rank TEXT,
  position TEXT,
  unit_short TEXT,
  birth_date TEXT,
  phone TEXT,
  ipn TEXT,
  service_category TEXT,
  deleted_at TEXT
);
INSERT INTO patients VALUES(1,'Тестовий Іван Петрович','Солдат','Стрілець','1','1990-01-02','+380501112233','111','контрактник','');
INSERT INTO "treatments" (id, patient_id, title, status, started_on, closed_on, cause, needs_injury_cert, deleted_at)
VALUES (1, 1, 'Гострий бронхіт', 'closed', '2024-08-20', '2024-09-05', 'somatic', '', '');
`;

const dump = parseDump(sample);
assert.equal(dump.tables.patients.rows.length, 1);
assert.equal(dump.tables.patients.rows[0].pib, 'Тестовий Іван Петрович');
assert.equal(dump.tables.treatments.rows[0].title, 'Гострий бронхіт');
assert.equal(dump.tables.treatments.rows[0].patient_id, 1);
assert.equal(
  extractUnitLabel({
    unitShort: String(dump.tables.patients.rows[0].unit_short),
    rank: String(dump.tables.patients.rows[0].rank),
  }),
  '1',
);
console.log('turso-sql parse tests passed');
