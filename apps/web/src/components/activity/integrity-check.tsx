'use client';

import { IconShieldCheck } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { useLazyVerifyActivityQuery } from '@/lib/api/activity-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** Asks the API to recheck every fingerprint in the log, and says what it found. */
export function IntegrityCheck() {
  const t = useTranslations('activity');
  const errorMessage = useErrorMessage();
  const [verify, { data, error, isFetching }] = useLazyVerifyActivityQuery();

  return (
    <>
      <Button
        color="secondary"
        iconLeading={IconShieldCheck}
        isLoading={isFetching}
        onPress={() => void verify()}
      >
        {isFetching ? t('checking') : t('checkIntegrity')}
      </Button>
      {error && <IntegrityResult tone="error">{errorMessage(error)}</IntegrityResult>}
      {data?.ok === true && (
        <IntegrityResult tone="success">{t('intact', { count: data.checked })}</IntegrityResult>
      )}
      {data?.ok === false && <IntegrityResult tone="error">{t('broken')}</IntegrityResult>}
    </>
  );
}

function IntegrityResult({ tone, children }: { tone: 'success' | 'error'; children: string }) {
  return (
    <Alert tone={tone} className="basis-full">
      {children}
    </Alert>
  );
}
