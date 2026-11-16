'use client';

import { isBoardPending, type BreachResponse } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';
import { timeLeft, type TimeLeft } from '@/lib/breach-clock';
import { useNow } from '@/lib/hooks/use-now';
import { cx } from '@/lib/utils/cx';

const UNITS = ['days', 'hours', 'minutes'] as const;

/** Days, hours and minutes as three figures. They are red once the report is overdue. */
function Figures({ left }: { left: TimeLeft }) {
  const t = useTranslations('breaches.clock');

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

function RunningClock({ breach }: { breach: BreachResponse }) {
  const t = useTranslations('breaches.clock');
  const format = useFormatter();
  const left = timeLeft(breach.reportDueAt, useNow());
  const due = format.dateTime(new Date(breach.reportDueAt), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

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

function StoppedClock({ breach }: { breach: BreachResponse }) {
  const t = useTranslations('breaches.clock');
  const format = useFormatter();
  const told = breach.steps.find((step) => step.step === 'tell_board')?.completedAt;
  const date = told
    ? format.dateTime(new Date(told), { dateStyle: 'medium', timeStyle: 'short' })
    : '';

  return <p className="text-body text-fg-muted">{t('boardTold', { date })}</p>;
}

/** Time left to tell the Board, counting down once a minute, or how late it is. It stops when the Board is told. */
export function BreachClockCard({ breach }: { breach: BreachResponse }) {
  const t = useTranslations('breaches.clock');

  return (
    <Card title={t('title')} description={t('description')}>
      {isBoardPending(breach.currentStep) ? (
        <RunningClock breach={breach} />
      ) : (
        <StoppedClock breach={breach} />
      )}
    </Card>
  );
}
