/** Two days, YYYY-MM-DD, the last one included. */
export interface DayRangeValue {
  start: string;
  end: string;
}

export type RangePreset = 'last30' | 'thisYear' | 'lastYear';

export const RANGE_PRESETS: RangePreset[] = ['last30', 'thisYear', 'lastYear'];

const pad = (value: number) => String(value).padStart(2, '0');
const dayOf = (year: number, month: number, date: number) => `${year}-${pad(month)}-${pad(date)}`;

/** The year an Indian financial year starts in: it runs from 1 April to 31 March. */
const financialYearStart = (today: Date): number =>
  today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;

/** A ready-made range for today's date. A financial year is 1 April to 31 March; the current one runs to today. */
export function presetRange(preset: RangePreset, today: Date): DayRangeValue {
  const todayText = dayOf(today.getFullYear(), today.getMonth() + 1, today.getDate());
  if (preset === 'last30') {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
    return {
      start: dayOf(start.getFullYear(), start.getMonth() + 1, start.getDate()),
      end: todayText,
    };
  }
  const year = financialYearStart(today);
  if (preset === 'thisYear') return { start: dayOf(year, 4, 1), end: todayText };
  return { start: dayOf(year - 1, 4, 1), end: dayOf(year, 3, 31) };
}

/** The query string for a range, empty when there is none. */
export function rangeQuery(range: DayRangeValue | null): string {
  if (!range) return '';
  return `?${new URLSearchParams({ from: range.start, to: range.end }).toString()}`;
}
