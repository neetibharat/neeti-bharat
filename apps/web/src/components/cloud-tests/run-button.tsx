'use client';

import { IconPlayerPlay } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { useRunConnectionMutation } from '@/lib/api/connections-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/**
 * The button that checks now, and what it says while it waits or when it cannot. `onRan` gets the new run. `leading` sits
 * beside the button, so the message below it never pushes it away.
 */
export function RunButton({
  id,
  onRan,
  leading,
}: {
  id: string;
  onRan: (runId: string) => void;
  leading?: ReactNode;
}) {
  const t = useTranslations('connections.card');
  const errorMessage = useErrorMessage();
  const [run, { isLoading, error }] = useRunConnectionMutation();

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {leading}
        <Button
          iconLeading={IconPlayerPlay}
          isLoading={isLoading}
          onPress={() => void run(id).then((result) => result.data && onRan(result.data.id))}
        >
          {t(isLoading ? 'running' : 'run')}
        </Button>
      </div>
      {isLoading && <p className="text-label text-fg-muted">{t('wait')}</p>}
      {error && <Alert tone="error">{errorMessage(error)}</Alert>}
    </div>
  );
}
