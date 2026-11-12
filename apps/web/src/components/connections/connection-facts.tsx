'use client';

import type { ConnectionSummary } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';

/** Which tenant and subscription the connection reads. These are not secret. */
export function Identifiers({ connection }: { connection: ConnectionSummary }) {
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
