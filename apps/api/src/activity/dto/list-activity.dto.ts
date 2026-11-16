import { ACTIVITY_ACTIONS, ACTIVITY_PAGE_SIZE } from '@dpdp-kit/shared';
import { z } from 'zod';

export const listActivitySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(ACTIVITY_PAGE_SIZE),
  action: z.enum(ACTIVITY_ACTIONS).optional(),
});

export type ListActivityQuery = z.output<typeof listActivitySchema>;
