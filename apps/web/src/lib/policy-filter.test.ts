import type { PolicyResponse } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { ALL } from './filters';
import {
  NO_POLICY_FILTERS,
  approverOf,
  approversIn,
  filterPolicies,
  isFiltered,
} from './policy-filter';

const policy = (id: string, ownerRole: string, approver: string, person: string | null = null) =>
  ({
    id,
    title: `Policy ${id}`,
    summary: `About ${id}`,
    ownerRole,
    approver,
    approverPerson: person ? { id: 'p', name: person } : null,
  }) as unknown as PolicyResponse;

const policies = [
  policy('P01', 'DPO', 'General Counsel'),
  policy('P02', 'DPO', 'Chief Technology Officer', 'Asha'),
  policy('P03', 'SECURITY_LEAD', 'Chief Technology Officer'),
];

describe('filterPolicies', () => {
  it('shows everything with no filters', () => {
    expect(filterPolicies(policies, NO_POLICY_FILTERS)).toHaveLength(3);
  });

  it('limits by owner and by approver', () => {
    expect(filterPolicies(policies, { ...NO_POLICY_FILTERS, owner: 'DPO' })).toHaveLength(2);
    const byApprover = filterPolicies(policies, { ...NO_POLICY_FILTERS, approver: 'Asha' });
    expect(byApprover.map((p) => p.id)).toEqual(['P02']);
  });

  it('combines the search with the other filters', () => {
    const result = filterPolicies(policies, { search: 'p0', owner: 'DPO', approver: ALL });
    expect(result.map((p) => p.id)).toEqual(['P01', 'P02']);
    expect(filterPolicies(policies, { ...NO_POLICY_FILTERS, search: 'nothing' })).toEqual([]);
  });
});

describe('approvers', () => {
  it('names the person when there is one, otherwise the title', () => {
    expect(approverOf(policies[0]!)).toBe('General Counsel');
    expect(approverOf(policies[1]!)).toBe('Asha');
  });

  it('lists each approver once, in order', () => {
    expect(approversIn(policies)).toEqual(['Asha', 'Chief Technology Officer', 'General Counsel']);
  });
});

describe('isFiltered', () => {
  it('is true only when something narrows the list', () => {
    expect(isFiltered(NO_POLICY_FILTERS)).toBe(false);
    expect(isFiltered({ ...NO_POLICY_FILTERS, search: '  ' })).toBe(false);
    expect(isFiltered({ ...NO_POLICY_FILTERS, owner: 'DPO' })).toBe(true);
  });
});
