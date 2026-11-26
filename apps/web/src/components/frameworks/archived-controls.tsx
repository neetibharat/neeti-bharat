'use client';

import type { ArchivedControlResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { useRestoreControlMutation } from '@/lib/api/control-edit-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** Controls that have been archived. They do not count until restored. */
export function ArchivedControls({ controls }: { controls: ArchivedControlResponse[] }) {
  const t = useTranslations('frameworks.archived');
  const errorMessage = useErrorMessage();
  const [restore, { isLoading, error }] = useRestoreControlMutation();

  return (
    <Card title={t('title')} description={t('description')}>
      {controls.length === 0 && <p className="text-body text-fg-muted">{t('empty')}</p>}
      <ul className="divide-y divide-line">
        {controls.map((control) => (
          <li key={control.id} className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-body text-fg">{control.title}</span>
            <Button
              color="secondary"
              size="sm"
              isDisabled={isLoading}
              onPress={() => void restore(control.id)}
            >
              {t('restore')}
            </Button>
          </li>
        ))}
      </ul>
      {error ? (
        <Alert tone="error" className="mt-3">
          {errorMessage(error)}
        </Alert>
      ) : null}
    </Card>
  );
}
