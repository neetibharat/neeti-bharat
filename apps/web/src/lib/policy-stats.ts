import {
  POLICY_STATUSES,
  type JobRole,
  type PolicyResponse,
  type PolicyStatus,
} from '@dpdp-kit/shared';

export type StatusCounts = Record<PolicyStatus, number>;

export interface OwnerCounts extends StatusCounts {
  role: JobRole;
  total: number;
}

const empty = (): StatusCounts => ({ draft: 0, in_review: 0, approved: 0 });

/** How many policies are in each status. */
export function statusCounts(policies: PolicyResponse[]): StatusCounts {
  const counts = empty();
  for (const policy of policies) counts[policy.status] += 1;
  return counts;
}

/** Each job that owns policies, with how far along they are. The job with the most policies comes first. */
export function countsByOwner(policies: PolicyResponse[]): OwnerCounts[] {
  const owners = new Map<JobRole, StatusCounts>();
  for (const policy of policies) {
    const counts = owners.get(policy.ownerRole) ?? empty();
    counts[policy.status] += 1;
    owners.set(policy.ownerRole, counts);
  }
  return [...owners]
    .map(([role, counts]) => ({
      role,
      ...counts,
      total: POLICY_STATUSES.reduce((sum, status) => sum + counts[status], 0),
    }))
    .sort((a, b) => b.total - a.total || a.role.localeCompare(b.role));
}
