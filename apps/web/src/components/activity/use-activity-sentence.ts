'use client';

import {
  CUSTOM_KEY_PREFIX,
  type ActivityEventResponse,
  type ProfileKey,
} from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { sentenceParams } from '@/lib/activity-params';
import { isControlStatus, isJobRole, isProfileKey } from '@/lib/guards';

type FieldLabel = (key: `${ProfileKey}.label`) => string;

/** Turns a log event into a sentence: its action code picks the wording, its details fill in the blanks. */
export function useActivitySentence(): (event: ActivityEventResponse) => string {
  const t = useTranslations('activity.actions');
  const tRoles = useTranslations('roles');
  const tJobs = useTranslations('jobRoles');
  const tValues = useTranslations('activity.values');
  const empty = useTranslations('activity')('emptyValue');
  const tFields = useTranslations('profile.fields');
  const tSteps = useTranslations('breaches.steps');
  const tRequestTypes = useTranslations('requests.types');

  /** Codes the log stores for roles and statuses are shown in words. Anything else is shown as it is. */
  const show = (value: unknown): string => {
    if (isJobRole(value)) return tJobs(value);
    if (isControlStatus(value)) return tValues(value);
    return String(value || empty);
  };

  return (event) =>
    t(
      event.action,
      sentenceParams(event, {
        role: (role) => tRoles(role),
        step: (step) => tSteps(step),
        requestType: (type) => tRequestTypes(type),
        show,
        entry: entryName(event, tFields),
      }),
    );
}

/** Added entries carry their own label; built-in ones are named from their key in the messages. */
function entryName(event: ActivityEventResponse, tFields: FieldLabel): string {
  const key = String(event.details?.key ?? '');
  if (key.startsWith(CUSTOM_KEY_PREFIX)) return String(event.details?.label ?? key);
  return isProfileKey(key) ? tFields(`${key}.label`) : key;
}
