import type { ActivityEventResponse } from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import { sentenceParams, type ParamWords } from './activity-params';

const words: ParamWords = {
  role: (role) => `role:${role}`,
  step: (step) => `step:${step}`,
  requestType: (type) => `type:${type}`,
  show: (value) => `shown:${String(value)}`,
  entry: 'Real entry',
};

const event = (overrides: Partial<ActivityEventResponse>): ActivityEventResponse => ({
  id: '1',
  occurredAt: '2026-01-01T00:00:00.000Z',
  actorLabel: 'Asha',
  action: 'PROFILE_UPDATED',
  details: null,
  before: null,
  after: null,
  ...overrides,
});

describe('sentenceParams', () => {
  it('fills the entry, before and after blanks from the event', () => {
    const params = sentenceParams(
      event({ before: { value: 'old' }, after: { value: 'new' } }),
      words,
    );
    expect(params).toEqual({ entry: 'Real entry', before: 'shown:old', after: 'shown:new' });
  });

  it('words a role code and shows other details as they are', () => {
    const params = sentenceParams(event({ details: { role: 'admin', email: 'a@b.in' } }), words);
    expect(params.role).toBe('role:admin');
    expect(params.email).toBe('shown:a@b.in');
  });

  it('words a breach step code, and only under the step key', () => {
    const params = sentenceParams(
      event({ details: { step: 'tell_board', title: 'close' } }),
      words,
    );
    expect(params.step).toBe('step:tell_board');
    expect(params.title).toBe('shown:close');
  });

  it('words a request type code, and only under the type key', () => {
    const params = sentenceParams(event({ details: { type: 'erasure', name: 'access' } }), words);
    expect(params.type).toBe('type:erasure');
    expect(params.name).toBe('shown:access');
  });

  it('shows an unknown role value without translating it', () => {
    expect(sentenceParams(event({ details: { role: 'wizard' } }), words).role).toBe('shown:wizard');
  });

  it('never lets details replace the reserved entry, before and after blanks', () => {
    const params = sentenceParams(
      event({
        details: { entry: 'spoof', before: 'spoof', after: 'spoof' },
        before: { value: 'old' },
        after: { value: 'new' },
      }),
      words,
    );
    expect(params).toEqual({ entry: 'Real entry', before: 'shown:old', after: 'shown:new' });
  });
});
