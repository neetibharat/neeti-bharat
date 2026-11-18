'use client';

import type { ConnectionSummary } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';
import { Link } from '@/i18n/navigation';
import { Identifiers } from './connection-facts';
import { EditConnectionButton } from './edit-connection-button';
import { RemoveConnectionButton } from './remove-connection-button';

/** When it was last checked and how that went, or that it has not been checked. */
function LastCheck({ connection }: { connection: ConnectionSummary }) {
  const t = useTranslations('connections.card');
  const format = useFormatter();
  const { lastRun } = connection;
  if (!lastRun) return <p className="text-label text-fg-muted">{t('neverChecked')}</p>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-label text-fg-muted">
        {t('lastChecked', {
          when: format.dateTime(new Date(lastRun.ranAt), {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        })}
      </p>
      <Badge color="success">{t('passed', { count: lastRun.passed })}</Badge>
      {lastRun.warned > 0 && (
        <Badge color="warning">{t('warned', { count: lastRun.warned })}</Badge>
      )}
      {lastRun.failed > 0 && <Badge color="danger">{t('failed', { count: lastRun.failed })}</Badge>}
    </div>
  );
}

function Account({
  connection,
  isAdmin,
  onRemoved,
}: {
  connection: ConnectionSummary;
  isAdmin: boolean;
  onRemoved: () => void;
}) {
  const t = useTranslations('connections.accounts');
  const provider = useTranslations('connections.provider');

  return (
    <li>
      <Card
        padding="sm"
        title={connection.name}
        description={provider(connection.provider)}
        actions={
          <>
            <Link
              href={`/cloud-tests?connection=${encodeURIComponent(connection.id)}`}
              className="text-label font-medium text-brand hover:underline"
            >
              {t('results')}
            </Link>
            {isAdmin && <EditConnectionButton connection={connection} />}
            {isAdmin && <RemoveConnectionButton connection={connection} onRemoved={onRemoved} />}
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Identifiers connection={connection} />
          <LastCheck connection={connection} />
        </div>
      </Card>
    </li>
  );
}

/** The accounts already connected, each with what it reads, how its last check went, and for an admin the way to change it. */
export function ConnectedAccounts({
  connections,
  isAdmin,
  onLastRemoved,
}: {
  connections: ConnectionSummary[];
  isAdmin: boolean;
  /** Called when the only account on the page is removed, so the page can step back. */
  onLastRemoved: () => void;
}) {
  const t = useTranslations('connections.accounts');

  return (
    <section className="flex flex-col gap-4" aria-labelledby="accounts-title">
      <div>
        <h2 id="accounts-title" className="text-title font-semibold text-fg">
          {t('title')}
        </h2>
        <p className="mt-0.5 text-body text-fg-muted">{t('description')}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {connections.map((connection) => (
          <Account
            key={connection.id}
            connection={connection}
            isAdmin={isAdmin}
            onRemoved={() => connections.length === 1 && onLastRemoved()}
          />
        ))}
      </ul>
    </section>
  );
}
