import { DEADLINE_TABS } from '@neeti-bharat/shared';
import { z } from 'zod';

const DEADLINES_PAGE_SIZE = 25;

export const listDeadlinesSchema = z.object({
  tab: z.enum(DEADLINE_TABS).default('overdue'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(DEADLINES_PAGE_SIZE),
});

export type ListDeadlinesQuery = z.output<typeof listDeadlinesSchema>;
