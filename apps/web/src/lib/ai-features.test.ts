import { AI_FEATURES, type AiSettingsResponse } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { featureAvailable, withFeature } from './ai-features';

const settings = (over: Partial<AiSettingsResponse> = {}): AiSettingsResponse => ({
  enabled: true,
  provider: 'anthropic',
  model: 'claude-haiku-5-5',
  keyHint: '1234',
  configuredByName: 'Asha',
  disabledFeatures: [],
  ...over,
});

describe('featureAvailable', () => {
  it('is on when a service is set up, the feature is not off, and the person can edit', () => {
    expect(featureAvailable(settings(), 'policy_tailor', true)).toBe(true);
  });

  it('is off for an auditor, with no service set up, while loading, or when an admin switched it off', () => {
    expect(featureAvailable(settings(), 'policy_tailor', false)).toBe(false);
    expect(featureAvailable(settings({ provider: null }), 'policy_tailor', true)).toBe(false);
    expect(featureAvailable(undefined, 'policy_tailor', true)).toBe(false);
    expect(
      featureAvailable(settings({ disabledFeatures: ['policy_tailor'] }), 'policy_tailor', true),
    ).toBe(false);
    expect(
      featureAvailable(settings({ disabledFeatures: ['policy_tailor'] }), 'policy_check', true),
    ).toBe(true);
  });
});

describe('withFeature', () => {
  it('switches one feature off or on, keeping the others and the listed order', () => {
    expect(withFeature([], AI_FEATURES, 'proof_check', false)).toEqual(['proof_check']);
    expect(withFeature(['proof_check'], AI_FEATURES, 'policy_import', false)).toEqual([
      'policy_import',
      'proof_check',
    ]);
    expect(withFeature(['policy_import', 'proof_check'], AI_FEATURES, 'proof_check', true)).toEqual(
      ['policy_import'],
    );
  });
});
