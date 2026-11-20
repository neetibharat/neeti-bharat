import { z } from 'zod';
import { dayString } from '../../frameworks/dto/day-string';

/** The days a list is cut to, both ends included. Either end may be left open. */
export const exportRangeSchema = z
  .object({ from: dayString.optional(), to: dayString.optional() })
  .refine((range) => !range.from || !range.to || range.from <= range.to, {
    message: 'The end of the range is before its start',
    path: ['to'],
  });

export type ExportRange = z.output<typeof exportRangeSchema>;
