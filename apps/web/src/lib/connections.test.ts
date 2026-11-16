import { describe, expect, it } from 'vitest';
import type { ConnectionCheckResult } from '@dpdp-kit/shared';
import { inView, outcomeKey } from './connections';

describe('outcomeKey', () => {
  it('has a sentence for a pass, and one for any problem, warned or failed', () => {
    expect(outcomeKey({ id: 'sql_tls', status: 'pass' })).toBe('pass');
    expect(outcomeKey({ id: 'sql_tls', status: 'warn' })).toBe('problem');
    expect(outcomeKey({ id: 'sql_tls', status: 'fail' })).toBe('problem');
  });

  it('says why a check gave no answer', () => {
    expect(outcomeKey({ id: 'sql_tls', status: 'skipped', reason: 'access' })).toBe(
      'skipped.access',
    );
    expect(outcomeKey({ id: 'sql_tls', status: 'skipped', reason: 'none' })).toBe('skipped.none');
  });

  it('treats a skipped check with no reason as an error', () => {
    expect(outcomeKey({ id: 'sql_tls', status: 'skipped' })).toBe('skipped.error');
  });
});

describe('inView', () => {
  const results: ConnectionCheckResult[] = [
    { id: 'sql_tls', status: 'pass' },
    { id: 'sql_auditing', status: 'warn' },
    { id: 'nsg_open_ports', status: 'fail' },
    { id: 'aks_rbac', status: 'skipped', reason: 'none' },
    { id: 'sql_firewall', status: 'fail' },
  ];

  it('shows only what failed or needs a look, failures first', () => {
    expect(inView(results, 'attention').map((r) => r.id)).toEqual([
      'nsg_open_ports',
      'sql_firewall',
      'sql_auditing',
    ]);
  });

  it('shows every check in all, most urgent first, and keeps the order of equal ones', () => {
    expect(inView(results, 'all').map((r) => r.id)).toEqual([
      'nsg_open_ports',
      'sql_firewall',
      'sql_auditing',
      'sql_tls',
      'aks_rbac',
    ]);
  });

  it('does not change the list it was given', () => {
    const before = results.map((r) => r.id);
    inView(results, 'all');
    expect(results.map((r) => r.id)).toEqual(before);
  });

  it('is empty when nothing needs attention', () => {
    expect(inView([{ id: 'sql_tls', status: 'pass' }], 'attention')).toEqual([]);
  });
});
