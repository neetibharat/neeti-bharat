import { describe, expect, it } from 'vitest';
import { fingerprint, stableStringify, type FingerprintInput } from './fingerprint';

const event: FingerprintInput = {
  occurredAt: new Date('2026-11-10T08:00:00.000Z'),
  actorId: 'u1',
  actorLabel: 'Asha',
  action: 'INVITATION_CREATED',
  subjectType: 'invitation',
  subjectId: 'inv-1',
  details: { email: 'a@company.in', role: 'member' },
  before: null,
  after: null,
};

describe('stableStringify', () => {
  it('gives the same text whatever order the keys are in', () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe(
      stableStringify({ a: { c: 3, d: 2 }, b: 1 }),
    );
  });

  it('keeps arrays in order and nulls as null', () => {
    expect(stableStringify({ list: [2, 1], none: null })).toBe('{"list":[2,1],"none":null}');
  });
});

describe('fingerprint', () => {
  it('is the same for the same event and the same previous fingerprint', () => {
    expect(fingerprint('abc', event)).toBe(fingerprint('abc', { ...event }));
  });

  it('changes when any part of the event changes', () => {
    const original = fingerprint(null, event);
    expect(fingerprint(null, { ...event, actorLabel: 'Someone else' })).not.toBe(original);
    expect(
      fingerprint(null, { ...event, details: { email: 'b@company.in', role: 'member' } }),
    ).not.toBe(original);
    expect(
      fingerprint(null, { ...event, occurredAt: new Date('2026-11-10T08:00:00.001Z') }),
    ).not.toBe(original);
  });

  it('ignores the extra columns a database row has, so a stored row hashes like the original event', () => {
    const row = { ...event, id: 'e1', seq: 1n, prevHash: null, hash: 'x' };
    expect(fingerprint(null, row)).toBe(fingerprint(null, event));
  });

  it('changes when the previous fingerprint changes, which is what links events together', () => {
    expect(fingerprint('one', event)).not.toBe(fingerprint('two', event));
  });
});
