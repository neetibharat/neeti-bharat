import {
  APP_ROLES,
  BREACH_STEPS,
  EVIDENCE_KINDS,
  INVITATION_STATUSES,
  JOB_ROLES,
  NOTIFICATION_KINDS,
  NOTIFICATION_STATES,
  PERSON_STATUSES,
  POLICY_STATUSES,
  PROOF_FREQUENCIES,
  REQUEST_SOURCES,
  REQUEST_STATUSES,
  REQUEST_TYPES,
  RULE_CONDITIONS,
  TASK_OUTCOMES,
} from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import {
  AppRole,
  BreachStep,
  EvidenceKind,
  InvitationStatus,
  JobRole,
  NotificationKind,
  NotificationState,
  PersonStatus,
  PolicyStatus,
  ProofFrequency,
  RequestSource,
  RequestStatus,
  RequestType,
  RequirementCondition,
  TaskOutcome,
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
    ['BreachStep', BreachStep, BREACH_STEPS],
    ['RequestType', RequestType, REQUEST_TYPES],
    ['RequestStatus', RequestStatus, REQUEST_STATUSES],
    ['RequestSource', RequestSource, REQUEST_SOURCES],
    ['TaskOutcome', TaskOutcome, TASK_OUTCOMES],
    ['NotificationKind', NotificationKind, NOTIFICATION_KINDS],
    ['NotificationState', NotificationState, NOTIFICATION_STATES],
  ])('%s', (_name, prismaEnum, shared) => {
    expect(Object.values(prismaEnum)).toEqual([...shared]);
  });
});
