import { describe, expect, it } from 'vitest';
import type { ConnectionCheckResult } from '@dpdp-kit/shared';
import { carryOver } from './carry-over';

const before = new Date('2026-11-01T10:00:00.000Z');

describe('carryOver', () => {
  it('keeps what was read again, and the rest as the run before found it, marked with when that was', () => {
    const previous: ConnectionCheckResult[] = [
      { id: 'sql_tls', status: 'fail' },
      { id: 'sql_firewall', status: 'pass' },
    ];
    const merged = carryOver([{ id: 'sql_tls', status: 'pass' }], {
      results: previous,
      ranAt: before,
    });
    expect(merged).toEqual([
      { id: 'sql_tls', status: 'pass' },
      { id: 'sql_firewall', status: 'pass', checkedAt: before.toISOString() },
    ]);
  });

  it('keeps the first reading time of a result carried over more than once', () => {
    const first = '2026-10-01T10:00:00.000Z';
    const merged = carryOver([{ id: 'sql_tls', status: 'pass' }], {
      results: [{ id: 'sql_firewall', status: 'pass', checkedAt: first }],
      ranAt: before,
    });
    expect(merged.find((result) => result.id === 'sql_firewall')?.checkedAt).toBe(first);
  });

  it('adds a check the run before did not have, and carries nothing when there was no run before', () => {
    const fresh: ConnectionCheckResult[] = [{ id: 'sql_tls', status: 'pass' }];
    expect(carryOver(fresh, { results: [], ranAt: before })).toEqual(fresh);
    expect(carryOver(fresh, null)).toEqual(fresh);
  });
});
