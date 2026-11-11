import type { PolicyResponse } from '@dpdp-kit/shared';
import { ALL, matchesSearch } from './filters';

/** What narrows the policy list. `ALL` for the owner or approver means no limit; an empty search matches everything. */
export interface PolicyFilters {
  search: string;
  owner: string;
  approver: string;
}

export const NO_POLICY_FILTERS: PolicyFilters = { search: '', owner: ALL, approver: ALL };

/** Who must approve: the named person, or else the plain title the policy starts with. */
export const approverOf = (policy: PolicyResponse): string =>
  policy.approverPerson ? policy.approverPerson.name : policy.approver;

export const isFiltered = (filters: PolicyFilters): boolean =>
  filters.search.trim() !== '' || filters.owner !== ALL || filters.approver !== ALL;

/** The policies that match the search, the owner and the approver. */
export function filterPolicies(
  policies: PolicyResponse[],
  filters: PolicyFilters,
): PolicyResponse[] {
  return policies.filter(
    (policy) =>
      (filters.owner === ALL || policy.ownerRole === filters.owner) &&
      (filters.approver === ALL || approverOf(policy) === filters.approver) &&
      matchesSearch([policy.id, policy.title, policy.summary], filters.search),
  );
}

/** The distinct approvers in the list, by name, for the filter. */
export const approversIn = (policies: PolicyResponse[]): string[] =>
  [...new Set(policies.map(approverOf))].sort((a, b) => a.localeCompare(b));
