import {
  proofDue,
  proofStatus,
  type EvidenceResponse,
  type ProofRequirementResponse,
} from '@dpdp-kit/shared';
import type { Evidence } from '../../generated/prisma/client';
import type { RequirementWithEvidence } from '../repositories/proof-requirement.repository';
import { day, iso, lastProvided } from './dates';

export const evidenceView = (row: Evidence): EvidenceResponse => ({
  id: row.id,
  kind: row.kind,
  title: row.title,
  url: row.url,
  note: row.note,
  addedByName: row.addedByName,
  createdAt: iso(row.createdAt)!,
});

/** One requirement with its proof, who collects it, and whether the proof is in, still good, and on time. */
export function requirementView(row: RequirementWithEvidence, now: Date): ProofRequirementResponse {
  const last = lastProvided(row.evidence);
  const due = proofDue(last, row.frequency, row.dueDate, now);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    frequency: row.frequency,
    status: proofStatus(last, row.frequency, now),
    assigneeId: row.assignee ? row.assignee.id : null,
    dueDate: day(row.dueDate),
    dueOn: iso(due.dueOn),
    overdue: due.overdue,
    evidence: row.evidence.map(evidenceView),
  };
}
