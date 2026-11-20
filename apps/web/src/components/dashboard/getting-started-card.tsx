'use client';

import { IconCircleCheck, IconCircleDashed } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/base/card/card';
import { ProgressBar } from '@/components/base/progress-bar/progress-bar';
import { Link } from '@/i18n/navigation';
import { useGetPeopleQuery } from '@/lib/api/people-api';
import { useGetPoliciesQuery } from '@/lib/api/frameworks-api';
import { useGetProfileQuery } from '@/lib/api/profile-api';
import { useGetReadinessQuery } from '@/lib/api/readiness-api';
import { allDone, startSteps, type StartStep } from '@/lib/getting-started';
import { statusCounts } from '@/lib/policy-stats';
import { cx } from '@/lib/utils/cx';

/** The first jobs of a new install. It shows until all four are done, then gives way to the rest of the page. */
export function GettingStartedCard() {
  const profile = useGetProfileQuery();
  const people = useGetPeopleQuery({ status: 'active', page: 1, limit: 1 });
  const readiness = useGetReadinessQuery();
  const policies = useGetPoliciesQuery();
  if (!profile.data || !people.data || !readiness.data || !policies.data) return null;

  const steps = startSteps({
    profile: profile.data.entries,
    people: people.data.total,
    readinessTaken: readiness.data.latest !== null,
    policiesApproved: statusCounts(policies.data.policies).approved,
  });
  return allDone(steps) ? null : <StepsCard steps={steps} />;
}

function StepsCard({ steps }: { steps: StartStep[] }) {
  const t = useTranslations('dashboard.gettingStarted');
  const done = steps.filter((step) => step.done).length;
  const next = steps.find((step) => !step.done);

  return (
    <Card title={t('title')} description={t('description')}>
      <div className="flex flex-col gap-4">
        <ProgressBar
          label={t('progressLabel')}
          value={(done / steps.length) * 100}
          valueText={t('progress', { done, total: steps.length })}
        />
        <ol className="grid gap-2 md:grid-cols-2">
          {steps.map((step) => (
            <StepRow key={step.id} step={step} isNext={step === next} />
          ))}
        </ol>
      </div>
    </Card>
  );
}

function StepRow({ step, isNext }: { step: StartStep; isNext: boolean }) {
  const t = useTranslations('dashboard.gettingStarted.steps');
  const StepIcon = step.done ? IconCircleCheck : IconCircleDashed;

  return (
    <li>
      <Link
        href={step.href}
        className={cx(
          'flex items-start gap-3 rounded-control border p-3 outline-none transition hover:bg-surface-muted focus-visible:focus-ring',
          isNext ? 'border-brand bg-brand-soft' : 'border-line/70',
        )}
      >
        <StepIcon
          className={cx('mt-0.5 size-5 shrink-0', step.done ? 'text-success' : 'text-fg-subtle')}
        />
        <span className="min-w-0">
          <span
            className={cx(
              'block text-body font-medium',
              step.done ? 'text-fg-muted line-through' : 'text-fg',
            )}
          >
            {t(`${step.id}.title`)}
          </span>
          <span className="block text-caption text-fg-muted">{t(`${step.id}.text`)}</span>
        </span>
      </Link>
    </li>
  );
}
