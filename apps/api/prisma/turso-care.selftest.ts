import assert from 'assert';
import { dayKey, looksLikeConsultation, mapCare, segmentDedupeKey } from './turso-care';

assert.equal(mapCare('consultation'), 'CONSULTATION');
assert.equal(mapCare('Консультація'), 'CONSULTATION');
assert.equal(mapCare('огляд хірурга'), 'CONSULTATION');
assert.equal(mapCare('inpatient'), 'HOSP');
assert.equal(mapCare('стаціонар'), 'HOSP');
assert.equal(mapCare('outpatient'), 'AMB');
assert.equal(mapCare('vlk'), 'VLK_LEAVE');
assert.equal(mapCare('ВЛК'), 'VLK_LEAVE');
assert.equal(mapCare('невідомий тип'), 'CONSULTATION');
assert.equal(looksLikeConsultation('Консультація'), true);
assert.equal(looksLikeConsultation('S92'), false);

const morning = new Date(2026, 8, 9, 0, 0, 0);
const afternoon = new Date(2026, 8, 9, 18, 30, 0);
assert.equal(dayKey(morning), '2026-09-09');
assert.equal(dayKey(afternoon), '2026-09-09');
assert.equal(
  segmentDedupeKey({
    episodeId: 'ep1',
    type: 'HOSP',
    dateFrom: morning,
    dateTo: null,
  }),
  segmentDedupeKey({
    episodeId: 'ep1',
    type: 'HOSP',
    dateFrom: afternoon,
    dateTo: null,
  }),
);

console.log('turso-care tests passed');
