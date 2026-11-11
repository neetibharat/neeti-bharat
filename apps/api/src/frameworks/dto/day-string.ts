import { z } from 'zod';
import { day, dayToDate } from '../utils/dates';

function isRealDay(value: string): boolean {
  const date = dayToDate(value);
  return date !== null && !Number.isNaN(date.getTime()) && day(date) === value;
}

/** A real calendar day written YYYY-MM-DD. `2027-02-30` is refused, not rolled over to March. */
export const dayString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(isRealDay);
