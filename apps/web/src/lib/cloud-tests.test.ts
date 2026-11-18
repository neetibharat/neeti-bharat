import { describe, expect, it } from 'vitest';
import type { ConnectionCheckResult } from '@dpdp-kit/shared';
import { countBySeverity, visibleResults } from './cloud-tests';

const results: ConnectionCheckResult[] = [
  { id: 'sql_tls', status: 'pass' },
  { id: 'storage_public_access', status: 'fail' }, // high
  { id: 'nsg_open_ports', status: 'fail' }, // high
  { id: 'sql_public_access', status: 'warn' }, // medium
  { id: 'defender_plans', status: 'warn' }, // low
  { id: 'aks_rbac', status: 'skipped', reason: 'none' },
];
const anything = () => true;

describe('countBySeverity', () => {
  it('counts the results it is given by how serious they are, so a view can pass what it lists', () => {
    expect(
      countBySeverity(results.filter((r) => r.status === 'fail' || r.status === 'warn')),
    ).toEqual({
      high: 2,
      medium: 1,
      low: 1,
    });
    expect(countBySeverity(results)).toEqual({ high: 4, medium: 1, low: 1 });
  });
});

describe('visibleResults', () => {
  it('puts failures before warnings, and the more serious first within each', () => {
    const shown = visibleResults(results, {
      view: 'attention',
      severity: 'all',
      matches: anything,
    });
    expect(shown.map((r) => r.id)).toEqual([
      'storage_public_access',
      'nsg_open_ports',
      'sql_public_access',
      'defender_plans',
    ]);
  });

  it('narrows to one severity and to what the search matches', () => {
    expect(
      visibleResults(results, { view: 'all', severity: 'high', matches: anything }).map(
        (r) => r.id,
      ),
    ).toEqual(['storage_public_access', 'nsg_open_ports', 'sql_tls', 'aks_rbac']);
    expect(
      visibleResults(results, {
        view: 'all',
        severity: 'all',
        matches: (id) => id === 'sql_tls',
      }).map((r) => r.id),
    ).toEqual(['sql_tls']);
  });
});
