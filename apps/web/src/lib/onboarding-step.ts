export const ONBOARDING_STEPS = ['company', 'scope', 'readiness', 'result'] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** The step named in the address, so a reload lands where the person was. Anything unknown means the first. */
export function parseStep(value: string | null | undefined): OnboardingStep {
  return ONBOARDING_STEPS.find((step) => step === value) ?? 'company';
}

/** Where the set-up is at a given step. */
export const onboardingHref = (step: OnboardingStep): string => `/onboarding?step=${step}`;
