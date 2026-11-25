import type { ExportRange } from '../dto/export-range.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

/** A date column cut to a range of days, in UTC. The last day is included, so the end is the start of the day after it. */
export function dateFilter(range?: ExportRange): { gte?: Date; lt?: Date } | undefined {
  if (!range?.from && !range?.to) return undefined;
  return {
    ...(range.from && { gte: new Date(`${range.from}T00:00:00.000Z`) }),
    ...(range.to && { lt: new Date(new Date(`${range.to}T00:00:00.000Z`).getTime() + DAY_MS) }),
  };
}

/** How a range reads in the activity log, such as " from 2026-04-01 to 2026-06-30". Empty when there is none. */
export function rangeText(range?: ExportRange): string {
  if (!range?.from && !range?.to) return '';
  return [range.from && ` from ${range.from}`, range.to && ` to ${range.to}`]
    .filter(Boolean)
    .join('');
}
