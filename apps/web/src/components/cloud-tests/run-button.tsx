'use client';

import { IconPlayerPlay } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { useRunConnectionMutation } from '@/lib/api/connections-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** The button that checks now, and what it says while it waits or when it cannot. `onRan` gets the new run. */
export function RunButton({ id, onRan }: { id: string; onRan: (runId: string) => void }) {
  const t = useTranslations('connections.card');
  const errorMessage = useErrorMessage();
  const [run, { isLoading, error }] = useRunConnectionMutation();

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        iconLeading={IconPlayerPlay}
        isLoading={isLoading}
        onPress={() => void run(id).then((result) => result.data && onRan(result.data.id))}
      >
        {t(isLoading ? 'running' : 'run')}
      </Button>
      {isLoading && <p className="text-label text-fg-muted">{t('wait')}</p>}
      {error && <Alert tone="error">{errorMessage(error)}</Alert>}
    </div>
  );
}
