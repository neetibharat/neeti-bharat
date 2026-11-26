import type { ProfileEntryResponse } from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import { changedAnswers, draftsFrom, invalidAnswers, withFallbacks } from './answer-drafts';

const entry = (
  key: string,
  kind: ProfileEntryResponse['kind'],
  value: string,
): ProfileEntryResponse => ({
  key,
  kind,
  value,
  group: 'general',
  isDefault: false,
  isCustom: false,
  requiresConfirmation: false,
});

const entries = [
  entry('companyName', 'text', 'Acme'),
  entry('website', 'url', ''),
  entry('grievanceEmail', 'email', 'g@acme.in'),
  entry('sendsDataAbroad', 'yesNo', 'no'),
];

describe('draftsFrom', () => {
  it('starts each answer from what is saved, and empty when there is none', () => {
    expect(draftsFrom(entries, ['companyName', 'website', 'missing'])).toEqual({
      companyName: 'Acme',
      website: '',
      missing: '',
    });
  });
});

describe('withFallbacks', () => {
  it('fills only the answers that are empty', () => {
    expect(
      withFallbacks(
        { companyName: '', website: 'https://a.in' },
        { companyName: 'Acme', website: 'x' },
      ),
    ).toEqual({
      companyName: 'Acme',
      website: 'https://a.in',
    });
  });
});

describe('changedAnswers', () => {
  it('keeps only what differs from what is saved', () => {
    const drafts = { companyName: 'Acme', website: 'https://acme.in', grievanceEmail: 'g@acme.in' };
    expect(changedAnswers(drafts, entries)).toEqual({ website: 'https://acme.in' });
  });

  it('is empty when nothing changed', () => {
    expect(changedAnswers(draftsFrom(entries, ['companyName']), entries)).toEqual({});
  });
});

describe('invalidAnswers', () => {
  it('names an email or address the API would refuse, and lets an empty answer be', () => {
    const drafts = { grievanceEmail: 'not an email', website: '', companyName: 'x' };
    expect(invalidAnswers(drafts, entries)).toEqual(['grievanceEmail']);
  });

  it('accepts good ones, with spaces around them', () => {
    expect(
      invalidAnswers({ website: ' https://acme.in ', grievanceEmail: ' g@acme.in ' }, entries),
    ).toEqual([]);
  });
});
