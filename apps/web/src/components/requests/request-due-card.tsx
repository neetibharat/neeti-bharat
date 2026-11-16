'use client';

import type { RequestResponse } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';
import { timeLeft, type TimeLeft } from '@/lib/breach-clock';
import { useNow } from '@/lib/hooks/use-now';
import { cx } from '@/lib/utils/cx';

const UNITS = ['days', 'hours', 'minutes'] as const;

/** Days, hours and minutes as three figures. They are red once the reply is overdue. */
function Figures({ left }: { left: TimeLeft }) {
  const t = useTranslations('requests.clock');

  return (
    <dl className="grid grid-cols-3 gap-3">
      {UNITS.map((unit) => (
        <div key={unit} className="rounded-control bg-surface-muted px-3 py-3 text-center">
          <dd
            className={cx(
              'text-stat font-medium tracking-tight tabular-nums',
              left.overdue ? 'text-danger' : 'text-fg',
            )}
          >
            {left[unit]}
          </dd>
          <dt className="text-caption text-fg-muted">{t(unit)}</dt>
        </div>
      ))}
    </dl>
  );
}

function RunningClock({ request }: { request: RequestResponse }) {
  const t = useTranslations('requests.clock');
  const format = useFormatter();
  const left = timeLeft(request.dueAt, useNow());
  const due = format.dateTime(new Date(request.dueAt), { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-label font-medium text-fg-muted">
          {t(left.overdue ? 'pastDue' : 'left')}
        </p>
        {left.overdue && <Badge color="danger">{t('overdue')}</Badge>}
      </div>
      <Figures left={left} />
      <p className="text-label text-fg-muted">{t('due', { date: due })}</p>
    </div>
  );
}

function StoppedClock({ request }: { request: RequestResponse }) {
  const t = useTranslations('requests.clock');
  const format = useFormatter();
  const date = request.closedAt
    ? format.dateTime(new Date(request.closedAt), { dateStyle: 'medium', timeStyle: 'short' })
    : '';

  return <p className="text-body text-fg-muted">{t('closed', { date })}</p>;
}

/** Time left to reply, counting down once a minute, or how late it is. It stops when the request is closed. */
export function RequestDueCard({ request }: { request: RequestResponse }) {
  const t = useTranslations('requests.clock');

  return (
    <Card title={t('title')} description={t('description')}>
      {request.status === 'done' ? (
        <StoppedClock request={request} />
      ) : (
        <RunningClock request={request} />
      )}
    </Card>
  );
}
