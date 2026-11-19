'use client';

import { IconArrowLeft, IconCertificate, IconPrinter } from '@tabler/icons-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Loading } from '@/components/base/loading/loading';
import { useCurrentUser } from '@/components/providers/user-provider';
import { Link } from '@/i18n/navigation';
import { useGetMyTrainingQuery } from '@/lib/api/training-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useDay } from './training-list';

/** The certificate itself: who, which company, which trainings and when. It prints cleanly, so it can be saved as a PDF. */
function Certificate(props: {
  name: string;
  company: string;
  on: string;
  items: { id: string; name: string; completedOn: string | null }[];
}) {
  const t = useTranslations('training.certificate');
  const dayOf = useDay();
  const format = useFormatter();
  const issued = format.dateTime(new Date(), { dateStyle: 'long' });

  return (
    <article className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-card border-2 border-brand-line bg-surface p-10 text-center shadow-card print:border print:shadow-none">
      <span className="grid size-16 place-items-center rounded-full bg-brand-soft text-brand">
        <IconCertificate className="size-8" />
      </span>
      <h1 className="text-heading font-medium tracking-tight text-fg">{t('title')}</h1>
      <div className="flex flex-col gap-1">
        <p className="text-body text-fg-muted">{t('awarded')}</p>
        <p className="text-display font-semibold text-fg">{props.name}</p>
        <p className="text-body text-fg-muted">{t('body', { company: props.company })}</p>
      </div>
      <ul className="flex w-full flex-col gap-2 border-y border-line py-4 text-left">
        {props.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 text-body">
            <span className="font-medium text-fg">{item.name}</span>
            <span className="text-fg-muted">
              {item.completedOn ? t('completedOn', { date: dayOf(item.completedOn) }) : ''}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-label text-fg-subtle">{t('issued', { date: issued })}</p>
    </article>
  );
}

/** The certificate for the signed-in person, once nothing is left to do. */
export function CertificatePage() {
  const t = useTranslations('training.certificate');
  const errorMessage = useErrorMessage();
  const user = useCurrentUser();
  const { data, error } = useGetMyTrainingQuery();

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data || !user) return <Loading />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href="/training"
          className="inline-flex items-center gap-1.5 text-label text-fg-muted hover:text-fg"
        >
          <IconArrowLeft className="size-4" />
          {t('back')}
        </Link>
        {data.completeOn && (
          <Button iconLeading={IconPrinter} onPress={() => window.print()}>
            {t('print')}
          </Button>
        )}
      </div>
      {data.completeOn ? (
        <Certificate
          name={user.name}
          company={user.organization.name}
          on={data.completeOn}
          items={data.items}
        />
      ) : (
        <Alert tone="info">{t('notYet')}</Alert>
      )}
    </div>
  );
}
