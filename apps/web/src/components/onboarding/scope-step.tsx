'use client';

import type { ProfileEntryResponse } from '@neeti-bharat/shared';
import { IconCircleCheck } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Card } from '@/components/base/card/card';
import { AnswerInputs, AnswerSwitches, StepActions } from './answer-fields';
import { useAnswers } from './use-answers';

const SWITCHES = ['handlesChildrenData', 'sendsDataAbroad', 'isSignificantFiduciary'] as const;
const CONTACTS = ['grievanceEmail', 'breachContact'] as const;

/** DPDP is the only framework so far, so it is chosen for the company and shown as such. */
function FrameworkChoice() {
  const t = useTranslations('onboarding.scope.framework');

  return (
    <div className="flex items-start gap-3 rounded-control border border-brand bg-brand-soft/40 p-4">
      <IconCircleCheck className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
      <div>
        <p className="text-body font-semibold text-fg">{t('name')}</p>
        <p className="text-label text-fg-muted">{t('about')}</p>
        <p className="mt-1 text-caption text-fg-subtle">{t('more')}</p>
      </div>
    </div>
  );
}

export interface ScopeStepProps {
  entries: ProfileEntryResponse[];
  onDone: () => void;
  onBack: () => void;
}

/** The second step: the framework, the three questions that switch rules on or off, and who to contact. */
export function ScopeStep({ entries, onDone, onBack }: ScopeStepProps) {
  const t = useTranslations('onboarding.scope');
  const answers = useAnswers(entries, [...SWITCHES, ...CONTACTS]);

  return (
    <Card title={t('title')} description={t('description')}>
      <div className="flex flex-col gap-5">
        <FrameworkChoice />
        <AnswerSwitches keys={SWITCHES} answers={answers} />
        <AnswerInputs keys={CONTACTS} answers={answers} />
        {answers.problem && <Alert tone="error">{answers.problem}</Alert>}
        <StepActions
          next={t('next')}
          back={t('back')}
          canContinue={answers.invalid.length === 0}
          isSaving={answers.isSaving}
          onBack={onBack}
          onNext={() => void answers.save().then((saved) => saved && onDone())}
        />
      </div>
    </Card>
  );
}
