import { describe, expect, it } from 'vitest';
import { onboardingHref, parseStep } from './onboarding-step';

describe('parseStep', () => {
  it('reads each step by name', () => {
    expect(parseStep('company')).toBe('company');
    expect(parseStep('scope')).toBe('scope');
    expect(parseStep('readiness')).toBe('readiness');
    expect(parseStep('result')).toBe('result');
  });

  it('starts at the first step when there is none or it is not one', () => {
    expect(parseStep(null)).toBe('company');
    expect(parseStep(undefined)).toBe('company');
    expect(parseStep('')).toBe('company');
    expect(parseStep('finish')).toBe('company');
  });
});

describe('onboardingHref', () => {
  it('names the step in the address', () => {
    expect(onboardingHref('scope')).toBe('/onboarding?step=scope');
  });
});
