import type { ApiKeySummary } from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import { keyState, lifetimeOf } from './api-keys';

const key = (over: Partial<ApiKeySummary> = {}): ApiKeySummary => ({
  id: 'k1',
  name: 'Claude Code',
  role: 'member',
  prefix: 'sk_live_ab12cd',
  createdByName: 'Alice',
  createdAt: '2026-11-01T00:00:00.000Z',
  expiresAt: null,
  lastUsedAt: null,
  revokedAt: null,
  ...over,
});

const NOW = new Date('2026-11-12T00:00:00.000Z');

describe('keyState', () => {
  it('is active when it is not revoked and has not run out', () => {
    expect(keyState(key(), NOW)).toBe('active');
    expect(keyState(key({ expiresAt: '2026-12-01T00:00:00.000Z' }), NOW)).toBe('active');
  });

  it('is expired once its time has passed', () => {
    expect(keyState(key({ expiresAt: '2026-11-11T00:00:00.000Z' }), NOW)).toBe('expired');
  });

  it('is revoked even when it has also run out', () => {
    const both = key({
      revokedAt: '2026-11-05T00:00:00.000Z',
      expiresAt: '2026-11-06T00:00:00.000Z',
    });
    expect(keyState(both, NOW)).toBe('revoked');
  });
});

describe('lifetimeOf', () => {
  it('reads the days of a choice, and nothing for a key that does not expire', () => {
    expect(lifetimeOf('90')).toBe(90);
    expect(lifetimeOf('never')).toBeUndefined();
  });
});
