export const DAYS_120_TYPES = ['HOSP', 'AMB', 'VLK_LEAVE', 'REHAB'] as const;

export type Days120Segment = {
  type: string;
  dateFrom: Date | string;
  dateTo?: Date | string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDay(value: Date): number {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function inclusiveDays(from: Date, to: Date): number {
  return Math.floor((utcDay(to) - utcDay(from)) / DAY_MS) + 1;
}

/** Last uninterrupted stretch of HOSP/AMB/VLK_LEAVE/REHAB. After «в строю» the previous stretch is what counts. */
export function computeContinuousDays120(segments: Days120Segment[], asOf = new Date()): number {
  const asOfDay = new Date(utcDay(asOf));
  const intervals = segments
    .filter((segment) => (DAYS_120_TYPES as readonly string[]).includes(segment.type))
    .map((segment) => {
      const from = new Date(utcDay(asDate(segment.dateFrom)));
      const rawTo = segment.dateTo ? asDate(segment.dateTo) : asOf;
      const to = new Date(utcDay(rawTo > asOf ? asOf : rawTo));
      return { from, to };
    })
    .filter((interval) => interval.from.getTime() <= asOfDay.getTime() && interval.to.getTime() >= interval.from.getTime())
    .sort((a, b) => a.from.getTime() - b.from.getTime());

  if (!intervals.length) return 0;

  const merged: { from: Date; to: Date }[] = [];
  for (const interval of intervals) {
    const prev = merged[merged.length - 1];
    if (prev && utcDay(interval.from) <= utcDay(prev.to) + DAY_MS) {
      if (interval.to > prev.to) prev.to = interval.to;
      continue;
    }
    merged.push({ from: new Date(interval.from), to: new Date(interval.to) });
  }

  const last = merged[merged.length - 1];
  return Math.max(0, inclusiveDays(last.from, last.to));
}
