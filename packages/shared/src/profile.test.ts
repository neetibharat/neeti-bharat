import { describe, expect, it } from 'vitest';
import {
  PROFILE_FIELDS,
  PROFILE_GROUPS,
  isValidProfileValue,
  requiresConfirmation,
} from './profile.js';

describe('PROFILE_FIELDS', () => {
  it('has unique keys, each in a known group', () => {
    const keys = PROFILE_FIELDS.map((field) => field.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const field of PROFILE_FIELDS) expect(PROFILE_GROUPS).toContain(field.group);
  });

  it('ships defaults that are valid answers', () => {
    for (const field of PROFILE_FIELDS) {
      if (field.defaultValue)
        expect(isValidProfileValue(field.kind, field.defaultValue)).toBe(true);
    }
  });

  it('gives every duration a default, so a deadline can always be worked out', () => {
    for (const field of PROFILE_FIELDS.filter((candidate) => candidate.kind === 'duration')) {
      expect(field.defaultValue).not.toBe('');
    }
  });
});

describe('isValidProfileValue', () => {
  it('takes only yes or no for a yes/no answer', () => {
    expect(isValidProfileValue('yesNo', 'yes')).toBe(true);
    expect(isValidProfileValue('yesNo', 'no')).toBe(true);
    expect(isValidProfileValue('yesNo', 'maybe')).toBe(false);
    expect(isValidProfileValue('yesNo', '')).toBe(false);
  });

  it('accepts a number and a unit for durations, and nothing looser', () => {
    expect(isValidProfileValue('duration', '72 hours')).toBe(true);
    expect(isValidProfileValue('duration', '1 year')).toBe(true);
    expect(isValidProfileValue('duration', 'three days')).toBe(false);
    expect(isValidProfileValue('duration', '0 hours')).toBe(false);
    expect(isValidProfileValue('duration', '')).toBe(false);
  });

  it('checks emails and websites, but allows them to be left empty', () => {
    expect(isValidProfileValue('email', 'dpo@company.in')).toBe(true);
    expect(isValidProfileValue('email', 'not an email')).toBe(false);
    expect(isValidProfileValue('url', 'https://www.company.in')).toBe(true);
    expect(isValidProfileValue('url', 'www.company.in')).toBe(false);
    expect(isValidProfileValue('url', 'ftp://company.in')).toBe(false);
    expect(isValidProfileValue('email', '')).toBe(true);
  });

  it('refuses very long answers', () => {
    expect(isValidProfileValue('text', 'x'.repeat(501))).toBe(false);
  });
});

describe('requiresConfirmation', () => {
  it('applies to legal limits only', () => {
    expect(requiresConfirmation('legalLimits')).toBe(true);
    expect(requiresConfirmation('contacts')).toBe(false);
    expect(requiresConfirmation('custom')).toBe(false);
  });
});
