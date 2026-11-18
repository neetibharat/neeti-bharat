'use client';

import type { ConnectionSummary } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { selectionOf } from '@/lib/github-selection';

function Fact({ label, children }: { label: string; children: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="truncate font-mono text-fg-muted">{children}</dd>
    </div>
  );
}

/** Which tenant and subscription, or which organisation and repositories, the connection reads. These are not secret. */
export function Identifiers({ connection }: { connection: ConnectionSummary }) {
  const t = useTranslations('connections.card');
  const { identifiers } = connection;

  if (connection.provider === 'github') {
    const selection = selectionOf(identifiers);
    return (
      <dl className="grid gap-x-6 gap-y-1 text-label sm:grid-cols-2">
        <Fact label={t('organisation')}>{identifiers.account ?? ''}</Fact>
        <Fact label={t('repositories')}>
          {selection.mode === 'all'
            ? t('allRepositories')
            : t('selectedRepositories', { count: selection.repositories.length })}
        </Fact>
      </dl>
    );
  }

  return (
    <dl className="grid gap-x-6 gap-y-1 text-label sm:grid-cols-2">
      <Fact label={t('tenant')}>{identifiers.tenantId ?? ''}</Fact>
      <Fact label={t('subscription')}>{identifiers.subscriptionId ?? ''}</Fact>
    </dl>
  );
}
