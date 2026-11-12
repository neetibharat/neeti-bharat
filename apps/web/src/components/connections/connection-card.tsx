'use client';

import { IconPlayerPlay } from '@tabler/icons-react';
import type { ConnectionSummary } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badge/badge';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { useCan } from '@/components/providers/user-provider';
import { useRunConnectionMutation } from '@/lib/api/connections-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { RemoveConnectionButton } from './remove-connection-button';
import { RunHistory } from './run-history';
import { RunResults } from './run-results';

function LastRun({ connection }: { connection: ConnectionSummary }) {
  const t = useTranslations('connections.card');
  const format = useFormatter();
  const { lastRun } = connection;
  if (!lastRun) return <p className="text-label text-fg-muted">{t('neverChecked')}</p>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-label text-fg-muted">
        {t('lastChecked', {
          when: format.dateTime(new Date(lastRun.ranAt), {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        })}
      </span>
      <Badge color="success">{t('passed', { count: lastRun.passed })}</Badge>
      {lastRun.warned > 0 && (
        <Badge color="warning">{t('warned', { count: lastRun.warned })}</Badge>
      )}
      {lastRun.failed > 0 && <Badge color="danger">{t('failed', { count: lastRun.failed })}</Badge>}
    </div>
  );
}

function Identifiers({ connection }: { connection: ConnectionSummary }) {
  const t = useTranslations('connections.card');

  return (
    <dl className="grid gap-x-6 gap-y-1 text-label sm:grid-cols-2">
      <div className="min-w-0">
        <dt className="text-fg-subtle">{t('tenant')}</dt>
        <dd className="truncate font-mono text-fg-muted">{connection.identifiers.tenantId}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-fg-subtle">{t('subscription')}</dt>
        <dd className="truncate font-mono text-fg-muted">
          {connection.identifiers.subscriptionId}
        </dd>
      </div>
    </dl>
  );
}

/** The button that checks now, and what it says while it waits or when it cannot. `onRan` gets the new run. */
function RunButton({ id, onRan }: { id: string; onRan: (runId: string) => void }) {
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

/** One connection: what it reads, when it was last checked, a button to check now, and its results and history. */
export function ConnectionCard({ connection }: { connection: ConnectionSummary }) {
  const t = useTranslations('connections');
  const { canEdit, isAdmin } = useCan();
  const [shownRun, setShownRun] = useState<string | null>(null);
  const runId = shownRun ?? connection.lastRun?.id;

  return (
    <div className="flex flex-col gap-4">
      <Card
        title={connection.name}
        description={t(`provider.${connection.provider}`)}
        actions={isAdmin ? <RemoveConnectionButton connection={connection} /> : null}
      >
        <div className="flex flex-col gap-4">
          <Identifiers connection={connection} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <LastRun connection={connection} />
            {canEdit && <RunButton id={connection.id} onRan={setShownRun} />}
          </div>
        </div>
      </Card>
      {runId && <RunResults runId={runId} />}
      <RunHistory connectionId={connection.id} onSelect={setShownRun} />
    </div>
  );
}
