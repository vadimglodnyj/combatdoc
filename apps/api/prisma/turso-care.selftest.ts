import assert from 'assert';
import { looksLikeConsultation, mapCare } from './turso-care';

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
console.log('turso-care tests passed');
