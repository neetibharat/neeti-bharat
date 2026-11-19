import type {
  MyPoliciesResponse,
  PolicyAcceptanceItem,
  PolicyAcceptanceStatus,
  TeamPolicyRow,
} from '@dpdp-kit/shared';
import type { ApprovedPolicy } from '../repositories/policy-acceptance.repository';
import { day } from './dates';

type Acceptance = { policyId: string; personId: string; acceptedAt: Date };

/** Accepted once the person accepted it after it was last approved. Before that, they accepted an earlier version. */
export function acceptanceStatus(
  policy: ApprovedPolicy,
  acceptedAt: Date | undefined,
): PolicyAcceptanceStatus {
  if (!acceptedAt) return 'todo';
  return acceptedAt >= policy.approvedAt ? 'accepted' : 'changed';
}

function itemOf(policy: ApprovedPolicy, acceptances: Acceptance[], personId: string) {
  const acceptedAt = acceptances.find(
    (a) => a.policyId === policy.id && a.personId === personId,
  )?.acceptedAt;
  return { policy, acceptedAt, status: acceptanceStatus(policy, acceptedAt) };
}

/** Each approved policy with where one person stands with it. */
export function toMyPolicies(
  policies: ApprovedPolicy[],
  acceptances: Acceptance[],
  personId: string,
): MyPoliciesResponse {
  const items: PolicyAcceptanceItem[] = policies.map((policy) => {
    const { acceptedAt, status } = itemOf(policy, acceptances, personId);
    return {
      policyId: policy.id,
      title: policy.title,
      summary: policy.summary,
      approvedOn: day(policy.approvedAt)!,
      acceptedOn: day(acceptedAt ?? null),
      status,
    };
  });
  return { items, acceptedAll: items.length > 0 && items.every((i) => i.status === 'accepted') };
}

/** How many of the approved policies one person has accepted in their current form. */
export function toTeamPolicyRow(
  policies: ApprovedPolicy[],
  acceptances: Acceptance[],
  personId: string,
): TeamPolicyRow {
  const accepted = policies.filter(
    (policy) => itemOf(policy, acceptances, personId).status === 'accepted',
  ).length;
  return { personId, accepted, total: policies.length };
}
