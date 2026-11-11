'use client';

import { useTranslations } from 'next-intl';
import { isReviewCadence } from '@/lib/guards';

/** A policy's review cadence in words. One the app has no wording for is shown as it came. */
export function useReviewCadence(): (cadence: string) => string {
  const t = useTranslations('policies.reviewEvery');
  return (cadence) => (isReviewCadence(cadence) ? t(cadence) : cadence);
}
