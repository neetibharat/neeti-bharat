'use client';

import type { BreachStepResponse } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Card } from '@/components/base/card/card';

function HistoryRow({ step }: { step: BreachStepResponse }) {
  const t = useTranslations('breaches');
  const format = useFormatter();
  const when = step.completedAt
    ? format.dateTime(new Date(step.completedAt), { dateStyle: 'medium', timeStyle: 'short' })
    : '';

  return (
    <li className="rounded-control border border-line px-3 py-2.5">
      <p className="text-body font-medium text-fg">{t(`steps.${step.step}`)}</p>
      <p className="text-caption text-fg-muted">
        {t('detail.doneBy', { name: step.completedByName ?? '', date: when })}
      </p>
      <p className="mt-1 text-label whitespace-pre-line text-fg">
        {step.note ?? <span className="text-fg-subtle">{t('detail.noNote')}</span>}
      </p>
    </li>
  );
}

/** The steps done so far, with who did them, when, and the note written with each. */
export function BreachHistoryCard({ steps }: { steps: BreachStepResponse[] }) {
  const t = useTranslations('breaches.detail');
  const done = steps.filter((step) => step.completed);

  return (
    <Card title={t('historyTitle')}>
      <ul className="flex flex-col gap-2">
        {done.map((step) => (
          <HistoryRow key={step.step} step={step} />
        ))}
      </ul>
    </Card>
  );
}
