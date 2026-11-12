'use client';

import { useTranslations } from 'next-intl';
import { cx } from '@/lib/utils/cx';

export interface StepperProps<T extends string> {
  steps: readonly T[];
  current: T;
}

/** The steps in a row, numbered. The one being worked on and those done are marked. */
export function Stepper<T extends string>({ steps, current }: StepperProps<T>) {
  const t = useTranslations('onboarding.steps');
  const position = steps.indexOf(current);

  return (
    <ol
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((step, index) => (
        <li key={step} aria-current={index === position ? 'step' : undefined}>
          <div className={cx('h-1 rounded-full', index <= position ? 'bg-brand' : 'bg-line')} />
          <p
            className={cx(
              'mt-1.5 text-caption',
              index === position ? 'font-semibold text-fg' : 'text-fg-subtle',
            )}
          >
            {index + 1}. {t(step as never)}
          </p>
        </li>
      ))}
    </ol>
  );
}
