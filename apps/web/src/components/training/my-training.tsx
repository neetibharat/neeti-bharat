'use client';

import { IconCertificate, IconSchool } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { Loading } from '@/components/base/loading/loading';
import { useCan } from '@/components/providers/user-provider';
import { Link } from '@/i18n/navigation';
import { useGetMyTrainingQuery } from '@/lib/api/training-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { TrainingList, useDay } from './training-list';

/** Shown once nothing is left to do, with a way to the certificate. */
function AllDone({ on }: { on: string }) {
  const t = useTranslations('training.mine');
  const dayOf = useDay();

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-card border border-success/30 bg-success-soft p-5">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface text-success shadow-soft">
        <IconCertificate className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-subtitle font-semibold text-fg">{t('allDone')}</p>
        <p className="text-body text-fg-muted">{t('allDoneOn', { date: dayOf(on) })}</p>
      </div>
      <Link
        href="/training/certificate"
        className="inline-flex items-center gap-1.5 rounded-control bg-success px-3 py-1.5 text-label font-semibold text-surface hover:opacity-90"
      >
        <IconCertificate className="size-4" />
        {t('certificate')}
      </Link>
    </div>
  );
}

/** The signed-in person's own trainings, each to take and mark done. */
export function MyTraining() {
  const t = useTranslations('training.mine');
  const errorMessage = useErrorMessage();
  const { canEdit } = useCan();
  const { data, error } = useGetMyTrainingQuery();

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;
  if (data.items.length === 0) {
    return <EmptyState icon={IconSchool} title={t('none.title')} description={t('none.body')} />;
  }
  return (
    <div className="flex flex-col gap-4">
      {data.completeOn && <AllDone on={data.completeOn} />}
      <TrainingList items={data.items} canAct={canEdit} />
    </div>
  );
}
