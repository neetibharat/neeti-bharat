import {
  reviewDueAt,
  type JobRole,
  type PolicyDetailResponse,
  type PolicyResponse,
  type PolicyStatus,
} from '@neeti-bharat/shared';

/** A policy as stored, with who must approve it and how many controls and versions it has. */
export interface PolicyRow {
  id: string;
  title: string;
  summary: string;
  ownerRole: JobRole;
  approverTitle: string;
  approver: { id: string; name: string } | null;
  reviewEvery: string;
  templateId: string | null;
  legalReferences: string[];
  status: PolicyStatus;
  approvedAt: Date | null;
  approvedByName: string | null;
  _count: { controls: number; approvals: number };
}

/** A policy as the list shows it: only what the list, the dashboard and the pickers read. */
export function policyView(row: PolicyRow): PolicyResponse {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    ownerRole: row.ownerRole,
    approver: row.approverTitle,
    approverPerson: row.approver && { id: row.approver.id, name: row.approver.name },
    reviewEvery: row.reviewEvery,
    status: row.status,
    reviewDueAt: row.approvedAt ? reviewDueAt(row.approvedAt).toISOString() : null,
    controlCount: row._count.controls,
    isCustom: row.templateId === null,
  };
}

/** What only a policy's own page shows, on top of what the list shows. */
export function policyFacts(
  row: PolicyRow,
): Pick<PolicyDetailResponse, 'legalReferences' | 'approvedAt' | 'approvedByName' | 'version'> {
  return {
    legalReferences: row.legalReferences,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    approvedByName: row.approvedByName,
    version: row._count.approvals,
  };
}
