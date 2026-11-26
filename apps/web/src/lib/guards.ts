import {
  APP_ROLES,
  BREACH_STEPS,
  CONTROL_STATUSES,
  JOB_ROLES,
  PROFILE_FIELDS,
  REQUEST_TYPES,
  TASK_OUTCOMES,
} from '@neeti-bharat/shared';
import type {
  AppRole,
  BreachStep,
  ControlStatus,
  JobRole,
  ProfileKey,
  RequestType,
  TaskOutcome,
} from '@neeti-bharat/shared';

/** A type guard for a fixed list of strings, so values from the API need no cast. */
function oneOf<T extends string>(list: readonly T[]) {
  return (value: unknown): value is T => list.some((item) => item === value);
}

export const isAppRole: (value: unknown) => value is AppRole = oneOf(APP_ROLES);
export const isBreachStep: (value: unknown) => value is BreachStep = oneOf(BREACH_STEPS);
export const isRequestType: (value: unknown) => value is RequestType = oneOf(REQUEST_TYPES);
export const isTaskOutcome: (value: unknown) => value is TaskOutcome = oneOf(TASK_OUTCOMES);
export const isJobRole: (value: unknown) => value is JobRole = oneOf(JOB_ROLES);
export const isControlStatus: (value: unknown) => value is ControlStatus = oneOf(CONTROL_STATUSES);
export const isProfileKey: (value: unknown) => value is ProfileKey = oneOf(
  PROFILE_FIELDS.map((field) => field.key),
);
/** The identity answers that have their own hint on the General page. */
export const isIdentityKey: (value: unknown) => value is 'companyName' | 'website' = oneOf([
  'companyName',
  'website',
]);
/** The review cadences that have a translated name. */
export const isReviewCadence: (value: unknown) => value is 'annual' = oneOf(['annual']);
