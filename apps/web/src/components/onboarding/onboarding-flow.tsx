'use client';

import type { ReadinessAnswers, ReadinessCheckResponse } from '@neeti-bharat/shared';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Alert } from '@/components/base/alert/alert';
import { BrandMark } from '@/components/base/brand-mark/brand-mark';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { Loading } from '@/components/base/loading/loading';
import { useCurrentUser } from '@/components/providers/user-provider';
import { ReadinessForm } from '@/components/readiness/readiness-form';
import { ReadinessResult } from '@/components/readiness/readiness-result';
import { useCompleteOnboardingMutation } from '@/lib/api/organizations-api';
import { useGetProfileQuery } from '@/lib/api/profile-api';
import { useTakeReadinessCheckMutation } from '@/lib/api/readiness-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { openApp } from '@/lib/open-app';
import {
  ONBOARDING_STEPS,
  onboardingHref,
  parseStep,
  type OnboardingStep,
} from '@/lib/onboarding-step';
import { useRouter } from '@/i18n/navigation';
import { useGetReadinessQuery } from '@/lib/api/readiness-api';
import { CompanyStep } from './company-step';
import { ScopeStep } from './scope-step';
import { Stepper } from './stepper';

type Step = OnboardingStep;

/** Ends the set-up and opens the app, whether it was finished or skipped. */
function useFinish() {
  const locale = useLocale();
  const [complete, { isLoading, error }] = useCompleteOnboardingMutation();

  async function finish() {
    const result = await complete();
    if (!('error' in result)) openApp(locale);
  }

  return { finish, isFinishing: isLoading, error };
}

interface ReadinessStepProps {
  onDone: () => void;
  onBack: () => void;
}

function ReadinessStep({ onDone, onBack }: ReadinessStepProps) {
  const t = useTranslations('onboarding.readiness');
  const errorMessage = useErrorMessage();
  const [take, { isLoading, error }] = useTakeReadinessCheckMutation();

  async function submit(answers: ReadinessAnswers) {
    const result = await take({ answers });
    if (result.data) onDone();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title={t('title')} description={t('description')} />
      <ReadinessForm
        isSaving={isLoading}
        problem={error ? errorMessage(error) : null}
        onSubmit={(answers) => void submit(answers)}
        onLeave={onBack}
      />
    </div>
  );
}

function Header({ onSkip, isSkipping }: { onSkip: () => void; isSkipping: boolean }) {
  const t = useTranslations('onboarding');
  const organization = useCurrentUser()?.organization;

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <BrandMark size="sm" />
        <div>
          <p className="text-subtitle font-semibold text-fg">{t('title')}</p>
          <p className="text-caption text-fg-muted">{organization?.name}</p>
        </div>
      </div>
      <Button color="tertiary" size="sm" isLoading={isSkipping} onPress={onSkip}>
        {t('skip')}
      </Button>
    </header>
  );
}

interface StepContentProps {
  step: Step;
  entries: Parameters<typeof CompanyStep>[0]['entries'];
  check: ReadinessCheckResponse | null;
  go: (step: Step) => void;
  onChecked: () => void;
  finish: { run: () => void; isFinishing: boolean };
}

function StepContent({ step, entries, check, go, onChecked, finish }: StepContentProps) {
  const t = useTranslations('onboarding');
  if (step === 'company') return <CompanyStep entries={entries} onDone={() => go('scope')} />;
  if (step === 'scope') {
    return (
      <ScopeStep entries={entries} onDone={() => go('readiness')} onBack={() => go('company')} />
    );
  }
  if (step === 'readiness') return <ReadinessStep onBack={() => go('scope')} onDone={onChecked} />;
  if (!check) return null;

  return (
    <div className="flex flex-col gap-4">
      <ReadinessResult check={check} />
      <div className="flex justify-end">
        <Button isLoading={finish.isFinishing} onPress={finish.run}>
          {t('finish')}
        </Button>
      </div>
    </div>
  );
}

/** Set-up for a new organisation: the company, the framework, a readiness check, and the score. */
export function OnboardingFlow() {
  const errorMessage = useErrorMessage();
  // The step is kept in the address, so a reload or the back button lands where the person was.
  const router = useRouter();
  const step = parseStep(useSearchParams().get('step'));
  const setStep = (next: Step) => router.replace(onboardingHref(next));
  const { data, error } = useGetProfileQuery();
  const check = useGetReadinessQuery().data?.latest ?? null;
  const { finish, isFinishing, error: finishError } = useFinish();
  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <Header onSkip={() => void finish()} isSkipping={isFinishing} />
      <Stepper steps={ONBOARDING_STEPS} current={step} />
      {finishError && <Alert tone="error">{errorMessage(finishError)}</Alert>}
      <StepContent
        step={step}
        entries={data.entries}
        check={check}
        go={setStep}
        onChecked={() => setStep('result')}
        finish={{ run: () => void finish(), isFinishing }}
      />
    </div>
  );
}
