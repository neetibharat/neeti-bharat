import type { CheckId, ConnectionProvider } from './connections.js';

/**
 * The proof a run of the checks can supply, and which checks stand behind it, for each system. A proof is listed only
 * when what the checks read is what the proof asks for. A run that passes every listed check for its system leaves a
 * dated note on the proof. The keys are catalogue ids of proof requirements.
 */
export const PROOF_CHECKS: Readonly<
  Record<string, Partial<Record<ConnectionProvider, readonly CheckId[]>>>
> = {
  // RC02 – User list, roles and MFA status
  'PR-P04-01': {
    azure: ['entra_mfa_registered', 'entra_mfa_enforced'],
    github: ['github_two_factor'],
  },
  // RC04 – Privileged (admin) access list
  'PR-P04-03': {
    azure: [
      'entra_admin_count',
      'rbac_privileged',
      'rbac_wildcard_roles',
      'rbac_service_principals',
    ],
    github: ['github_owner_count'],
  },
  // RQ04 – Encryption, masking or tokenisation
  'PR-P05-01': {
    azure: [
      'storage_secure_transfer',
      'encryption_at_rest',
      'sql_tls',
      'flexible_servers_tls',
      'webapp_https',
    ],
  },
};

/** Who the proof and the activity log name for a note that no person wrote. */
export const PROOF_SNAPSHOT_ACTOR = 'Automatic check';

/** A connection leaves at most one note on a proof in this many days, so a daily schedule does not bury the proof. */
export const PROOF_SNAPSHOT_GAP_DAYS = 7;

export const CHECK_ACCEPTANCE_REASON_MAX_LENGTH = 500;
export const CHECK_ACCEPTANCE_RESOURCE_MAX_LENGTH = 300;

/**
 * A person's decision that something a check flags is deliberate, such as a database that is open to the public network
 * behind a firewall. The check still shows it, and the proof no longer waits on it. An empty `resourceName` accepts the
 * check as a whole, for a check that names no resources.
 */
export interface CheckAcceptanceResponse {
  id: string;
  connectionId: string;
  checkId: CheckId;
  resourceName: string;
  reason: string;
  acceptedByName: string;
  acceptedAt: string;
}

export interface CheckAcceptanceListResponse {
  items: CheckAcceptanceResponse[];
}

export interface AcceptCheckRequest {
  checkId: CheckId;
  resourceName: string;
  reason: string;
}
