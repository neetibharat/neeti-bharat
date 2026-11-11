import {
  APP_ROLES,
  EVIDENCE_KINDS,
  INVITATION_STATUSES,
  JOB_ROLES,
  PERSON_STATUSES,
  POLICY_STATUSES,
  PROOF_FREQUENCIES,
  RULE_CONDITIONS,
} from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import {
  AppRole,
  EvidenceKind,
  InvitationStatus,
  JobRole,
  PersonStatus,
  PolicyStatus,
  ProofFrequency,
  RequirementCondition,
} from '../../generated/prisma/enums';

// A list in packages/shared that drifts from the database enum would let the API store or send a value the other side rejects.
describe('database enums match packages/shared', () => {
  it.each([
    ['JobRole', JobRole, JOB_ROLES],
    ['AppRole', AppRole, APP_ROLES],
    ['PersonStatus', PersonStatus, PERSON_STATUSES],
    ['InvitationStatus', InvitationStatus, INVITATION_STATUSES],
    ['RequirementCondition', RequirementCondition, RULE_CONDITIONS],
    ['ProofFrequency', ProofFrequency, PROOF_FREQUENCIES],
    ['EvidenceKind', EvidenceKind, EVIDENCE_KINDS],
    ['PolicyStatus', PolicyStatus, POLICY_STATUSES],
  ])('%s', (_name, prismaEnum, shared) => {
    expect(Object.values(prismaEnum)).toEqual([...shared]);
  });
});
