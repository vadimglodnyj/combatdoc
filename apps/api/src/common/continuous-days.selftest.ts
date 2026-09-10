import assert from 'assert';
import { computeContinuousDays120 } from './continuous-days';

const asOf = new Date('2026-09-10T12:00:00Z');

assert.equal(computeContinuousDays120([], asOf), 0);

assert.equal(
  computeContinuousDays120(
    [{ type: 'HOSP', dateFrom: '2026-09-10T00:00:00Z', dateTo: null }],
    asOf,
  ),
  1,
);

assert.equal(
  computeContinuousDays120(
    [{ type: 'HOSP', dateFrom: '2026-09-01T00:00:00Z', dateTo: '2026-09-10T00:00:00Z' }],
    asOf,
  ),
  10,
);

assert.equal(
  computeContinuousDays120(
    [
      { type: 'HOSP', dateFrom: '2026-09-01T00:00:00Z', dateTo: '2026-09-05T00:00:00Z' },
      { type: 'AMB', dateFrom: '2026-09-06T00:00:00Z', dateTo: '2026-09-10T00:00:00Z' },
    ],
    asOf,
  ),
  10,
);

assert.equal(
  computeContinuousDays120(
    [
      { type: 'HOSP', dateFrom: '2026-07-01T00:00:00Z', dateTo: '2026-07-20T00:00:00Z' },
      { type: 'AMB', dateFrom: '2026-09-01T00:00:00Z', dateTo: '2026-09-05T00:00:00Z' },
    ],
    asOf,
  ),
  5,
);

assert.equal(
  computeContinuousDays120(
    [{ type: 'PHYS', dateFrom: '2026-09-01T00:00:00Z', dateTo: null }],
    asOf,
  ),
  0,
);

console.log('continuous-days tests passed');
