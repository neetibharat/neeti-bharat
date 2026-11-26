import { AI_FEATURES, type AiSettingsResponse } from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import { featureAvailable, withFeature } from './ai-features';

const settings = (over: Partial<AiSettingsResponse> = {}): AiSettingsResponse => ({
  provider: 'anthropic',
  model: 'claude-haiku-5-5',
  keyHint: '1234',
  enabledFeatures: ['policy_tailor'],
  ...over,
});

describe('featureAvailable', () => {
  it('is on when the install has a service, the feature is switched on, and the person can edit', () => {
    expect(featureAvailable(settings(), 'policy_tailor', true)).toBe(true);
  });

  it('is off for an auditor, with no service, while loading, or until an admin switches it on', () => {
    expect(featureAvailable(settings(), 'policy_tailor', false)).toBe(false);
    expect(featureAvailable(settings({ provider: null }), 'policy_tailor', true)).toBe(false);
    expect(featureAvailable(undefined, 'policy_tailor', true)).toBe(false);
    expect(featureAvailable(settings({ enabledFeatures: [] }), 'policy_tailor', true)).toBe(false);
    expect(featureAvailable(settings(), 'policy_check', true)).toBe(false);
  });
});

describe('withFeature', () => {
  it('switches one feature on or off, keeping the others and the listed order', () => {
    expect(withFeature([], AI_FEATURES, 'proof_check', true)).toEqual(['proof_check']);
    expect(withFeature(['proof_check'], AI_FEATURES, 'policy_import', true)).toEqual([
      'policy_import',
      'proof_check',
    ]);
    expect(
      withFeature(['policy_import', 'proof_check'], AI_FEATURES, 'proof_check', false),
    ).toEqual(['policy_import']);
  });
});
