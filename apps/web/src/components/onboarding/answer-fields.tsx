'use client';

import type { ProfileKey } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Input } from '@/components/base/input/input';
import { Switch } from '@/components/base/switch/switch';
import type { useAnswers } from './use-answers';

type Answers = ReturnType<typeof useAnswers>;

/** A text answer for each key, labelled and explained from Company profile. */
export function AnswerInputs({
  keys,
  answers,
  required,
}: {
  keys: readonly string[];
  answers: Answers;
  required?: string;
}) {
  const tFields = useTranslations('profile.fields');

  return (
    <>
      {keys.map((key) => (
        <Input
          key={key}
          label={tFields(`${key as ProfileKey}.label`)}
          hint={key === required ? undefined : tFields(`${key as ProfileKey}.hint`)}
          value={answers.drafts[key]}
          onChange={(value) => answers.set(key, value)}
          isInvalid={answers.invalid.includes(key)}
          isRequired={key === required}
        />
      ))}
    </>
  );
}

/** A yes or no answer for each key as a switch. A switch that was never touched holds its default, no. */
export function AnswerSwitches({ keys, answers }: { keys: readonly string[]; answers: Answers }) {
  const tFields = useTranslations('profile.fields');

  return (
    <div className="divide-y divide-line">
      {keys.map((key) => {
        const label = tFields(`${key as ProfileKey}.label`);
        return (
          <div key={key} className="flex items-center justify-between gap-4 py-3 first:pt-0">
            <div>
              <p className="text-label font-semibold text-fg">{label}</p>
              <p className="text-caption text-fg-subtle">{tFields(`${key as ProfileKey}.hint`)}</p>
            </div>
            <Switch
              aria-label={label}
              isSelected={answers.drafts[key] === 'yes'}
              onChange={(on) => answers.set(key, on ? 'yes' : 'no')}
            />
          </div>
        );
      })}
    </div>
  );
}

export interface StepActionsProps {
  next: string;
  canContinue: boolean;
  isSaving: boolean;
  onNext: () => void;
  back?: string;
  onBack?: () => void;
}

/** Back and Continue at the foot of a step. */
export function StepActions({
  next,
  canContinue,
  isSaving,
  onNext,
  back,
  onBack,
}: StepActionsProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      {onBack ? (
        <Button color="secondary" onPress={onBack}>
          {back}
        </Button>
      ) : (
        <span />
      )}
      <Button isDisabled={!canContinue} isLoading={isSaving} onPress={onNext}>
        {next}
      </Button>
    </div>
  );
}
