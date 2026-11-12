'use client';

import type { ErrorCode } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { isApiError } from '@/lib/api/base-api';

/** Turns an API error (or any failure) into the translated message for its code, with the values it carries filled in. */
export function useErrorMessage(): (error: unknown) => string {
  const t = useTranslations('errors');
  return (error) =>
    isApiError(error) ? t(error.code, error.params) : t('INTERNAL' satisfies ErrorCode);
}
