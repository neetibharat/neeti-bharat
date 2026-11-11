import { ACTIVITY_ACTIONS } from '@dpdp-kit/shared';
import { z } from 'zod';

export const listActivitySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().regex(/^\d+$/).optional(),
  action: z.enum(ACTIVITY_ACTIONS).optional(),
});

export type ListActivityQuery = z.output<typeof listActivitySchema>;
