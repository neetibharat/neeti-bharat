import { JOB_ROLES } from '@dpdp-kit/shared';
import { z } from 'zod';

export const jobRole = z
  .enum(JOB_ROLES)
  .describe(
    'The job: DPO, PRIVACY_LEAD, SECURITY_LEAD, ENGINEERING_LEAD, PROCUREMENT_LEAD, HR_LEAD, AI_OWNER, LEGAL_COUNSEL or INTERNAL_AUDIT',
  );

/** A real calendar date as YYYY-MM-DD. The API checks that it exists. */
export const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

export const personId = z
  .string()
  .min(1)
  .describe('A person’s id from list_people. Never guess one.');

/** The ids in a path are written by the API, so anything else is a mistake. Nothing may break out of the path. */
export const id = (what: string) =>
  z
    .string()
    .regex(/^[\w:.-]+$/, 'An id has only letters, digits, dashes, dots, colons and underscores')
    .describe(what);

/** Keeps a value out of the body of an update when Claude left it out, so the current one stays. */
export const defined = <T extends object>(values: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
