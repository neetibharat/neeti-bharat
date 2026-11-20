'use client';

import { customAnswerLabel } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { isProfileKey } from '@/lib/guards';

const TOKEN = /\{\{([^{}]+)\}\}/g;

/**
 * Turns the {{keys}} in a line into words people know: the company's own answer where there is one, so a line reads as the
 * policy does, and otherwise the name of the answer, such as "Hosting region". A note never shows the machinery of the text.
 */
export function useHumanise(
  values: Readonly<Record<string, string>> = {},
): (text: string) => string {
  const tFields = useTranslations('profile.fields');
  return (text) =>
    text.replace(TOKEN, (_, key: string) => {
      if (values[key]) return values[key];
      return isProfileKey(key) ? tFields(`${key}.label`) : customAnswerLabel(key);
    });
}
