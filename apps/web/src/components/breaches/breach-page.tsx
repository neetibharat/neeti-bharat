'use client';

import { IconChevronLeft } from '@tabler/icons-react';
import type { BreachResponse } from '@neeti-bharat/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Loading } from '@/components/base/loading/loading';
import { useCan } from '@/components/providers/user-provider';
import { Link } from '@/i18n/navigation';
import { useGetBreachQuery } from '@/lib/api/breaches-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { BreachClockCard } from './breach-clock-card';
import { BreachDetailsCard } from './breach-details-card';
import { BreachHistoryCard } from './breach-history-card';
import { BreachStepCard } from './breach-step-card';
import { BreachTracker } from './breach-tracker';
import { EditBreachButton } from './edit-breach-button';

function BackLink() {
  const t = useTranslations('breaches');
  return (
    <Link
      href="/breaches"
      className="mb-3 inline-flex items-center gap-1 text-label font-medium text-fg-muted hover:text-fg"
    >
      <IconChevronLeft className="size-4" />
      {t('back')}
    </Link>
  );
}

/** One breach on its own page: the five steps, the clock, what happened, and the step to do now. */
export function BreachPage({ breachId }: { breachId: string }) {
  const errorMessage = useErrorMessage();
  const { data, error } = useGetBreachQuery(breachId);

  if (error) {
    return (
      <>
        <BackLink />
        <Alert tone="error">{errorMessage(error)}</Alert>
      </>
    );
  }
  if (!data) return <Loading />;

  return (
    <>
      <BackLink />
      <Body breach={data} />
    </>
  );
}

/** Tells a closed breach apart: it has no step to do, and it cannot be edited. */
function ClosedNotice({ breach }: { breach: BreachResponse }) {
  const t = useTranslations('breaches.detail');
  const format = useFormatter();
  if (!breach.closedAt) return null;
  const date = format.dateTime(new Date(breach.closedAt), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Alert tone="success" title={t('closedTitle')}>
      {t('closedText', { date })}
    </Alert>
  );
}

function Body({ breach }: { breach: BreachResponse }) {
  const { canEdit } = useCan();
  const isOpen = breach.closedAt === null;

  return (
    <>
      <PageHeader
        title={breach.title}
        actions={canEdit && isOpen ? <EditBreachButton breach={breach} /> : undefined}
      />
      <div className="flex flex-col gap-5">
        <BreachTracker steps={breach.steps} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] [&>*]:min-w-0">
          <div className="flex flex-col gap-5">
            <ClosedNotice breach={breach} />
            {canEdit && <BreachStepCard breach={breach} />}
            <BreachDetailsCard breach={breach} />
            <BreachHistoryCard steps={breach.steps} />
          </div>
          <BreachClockCard breach={breach} />
        </div>
      </div>
    </>
  );
}
