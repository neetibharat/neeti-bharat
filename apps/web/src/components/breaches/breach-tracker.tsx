'use client';

import { IconCheck } from '@tabler/icons-react';
import type { BreachStepResponse } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Card } from '@/components/base/card/card';
import { trackerSteps, type StepState, type TrackerStep } from '@/lib/breach-steps';
import { cx } from '@/lib/utils/cx';

const MARKS: Record<StepState, string> = {
  done: 'bg-success-soft text-success',
  current: 'bg-brand text-on-brand',
  upcoming: 'bg-surface-muted text-fg-muted',
};

function Mark({ step, index }: { step: TrackerStep; index: number }) {
  return (
    <span
      className={cx(
        'grid size-8 shrink-0 place-items-center rounded-full text-label font-semibold',
        MARKS[step.state],
      )}
    >
      {step.state === 'done' ? <IconCheck className="size-4" /> : index + 1}
    </span>
  );
}

/** Who did it and when, for a step that is done; otherwise whether it is the one to do now. */
function StepCaption({ step }: { step: TrackerStep }) {
  const t = useTranslations('breaches.detail');
  const format = useFormatter();
  if (step.state !== 'done' || !step.completedAt) {
    return (
      <p className="text-caption text-fg-subtle">
        {t(step.state === 'current' ? 'stateCurrent' : 'stateUpcoming')}
      </p>
    );
  }
  const when = format.dateTime(new Date(step.completedAt), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <>
      <p className="text-caption text-fg-muted">{step.completedByName}</p>
      <p className="text-caption text-fg-subtle">{when}</p>
    </>
  );
}

/** The five steps side by side: done, the one to do now, and the ones to come. */
export function BreachTracker({ steps }: { steps: BreachStepResponse[] }) {
  const t = useTranslations('breaches');

  return (
    <Card>
      <ol aria-label={t('detail.trackerLabel')} className="grid gap-4 sm:grid-cols-5 [&>*]:min-w-0">
        {trackerSteps(steps).map((step, index) => (
          <li
            key={step.step}
            aria-current={step.state === 'current' ? 'step' : undefined}
            className="flex items-start gap-3 sm:flex-col"
          >
            <Mark step={step} index={index} />
            <div className="min-w-0">
              <p
                className={cx(
                  'text-body font-semibold',
                  step.state === 'upcoming' ? 'text-fg-muted' : 'text-fg',
                )}
              >
                {t(`steps.${step.step}`)}
              </p>
              <StepCaption step={step} />
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
