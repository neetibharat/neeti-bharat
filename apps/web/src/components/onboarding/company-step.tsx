'use client';

import type { ProfileEntryResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Card } from '@/components/base/card/card';
import { LogoPicker } from '@/components/profile/logo-setting';
import { useCurrentUser } from '@/components/providers/user-provider';
import { AnswerInputs, StepActions } from './answer-fields';
import { useAnswers } from './use-answers';

const KEYS = ['companyName', 'website', 'hostingRegion', 'languagesOffered'] as const;

export interface CompanyStepProps {
  entries: ProfileEntryResponse[];
  onDone: () => void;
}

/** The first step: what the company is called and where to find it. These fill policies, notices and reports. */
export function CompanyStep({ entries, onDone }: CompanyStepProps) {
  const t = useTranslations('onboarding.company');
  const organizationName = useCurrentUser()?.organization.name ?? '';
  const answers = useAnswers(entries, KEYS, { companyName: organizationName });
  const named = (answers.drafts.companyName ?? '').trim() !== '';

  return (
    <Card title={t('title')} description={t('description')}>
      <div className="flex flex-col gap-4">
        <AnswerInputs keys={KEYS} answers={answers} required="companyName" />
        <div>
          <p className="mb-2 text-label font-semibold text-fg">{t('logo')}</p>
          <LogoPicker />
        </div>
        {answers.problem && <Alert tone="error">{answers.problem}</Alert>}
        <StepActions
          next={t('next')}
          canContinue={named && answers.invalid.length === 0}
          isSaving={answers.isSaving}
          onNext={() => void answers.save().then((saved) => saved && onDone())}
        />
      </div>
    </Card>
  );
}
