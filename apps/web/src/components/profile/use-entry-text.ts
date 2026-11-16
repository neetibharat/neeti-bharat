'use client';

import type { ProfileEntryResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { isProfileKey } from '@/lib/guards';

/** The name and the one-line hint of an answer. Built-in answers are worded in messages; added ones carry their own label. */
export function useEntryText() {
  const t = useTranslations('profile.fields');

  return {
    label: (entry: ProfileEntryResponse): string =>
      entry.label ?? (isProfileKey(entry.key) ? t(`${entry.key}.label`) : entry.key),
    hint: (entry: ProfileEntryResponse): string | undefined =>
      !entry.isCustom && isProfileKey(entry.key) ? t(`${entry.key}.hint`) : undefined,
  };
}
