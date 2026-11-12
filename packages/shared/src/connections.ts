/** The outside systems DPDP Kit can connect to and check. */
export const CONNECTION_PROVIDERS = ['azure'] as const;
export type ConnectionProvider = (typeof CONNECTION_PROVIDERS)[number];

/**
 * What an Azure connection asks for: an app registration in the tenant, with read-only access. The identifiers are
 * shown afterwards; the secret is kept encrypted and is never sent back.
 */
export const AZURE_CREDENTIAL_FIELDS = [
  { id: 'tenantId', secret: false },
  { id: 'clientId', secret: false },
  { id: 'subscriptionId', secret: false },
  { id: 'clientSecret', secret: true },
] as const;
export type AzureCredentialField = (typeof AZURE_CREDENTIAL_FIELDS)[number]['id'];

/** Tenant, client and subscription ids are GUIDs. Checking the shape also keeps anything else out of the addresses we call. */
export const AZURE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const CONNECTION_SECRET_MAX_LENGTH = 400;
export const CONNECTION_NAME_MAX_LENGTH = 80;

/** What the Azure connection looks at, in the order they are listed. */
export const AZURE_CHECK_IDS = [
  'entra_mfa_registered',
  'entra_mfa_enforced',
  'entra_admin_count',
  'storage_secure_transfer',
  'storage_public_access',
  'keyvault_protection',
  'sql_tls',
  'sql_public_access',
  'sql_auditing',
  'data_in_india',
  'nsg_open_ports',
] as const;
export type AzureCheckId = (typeof AZURE_CHECK_IDS)[number];

/** The checks in groups, as the results page lists them. */
export const AZURE_CHECK_GROUPS = [
  { id: 'identity', checks: ['entra_mfa_registered', 'entra_mfa_enforced', 'entra_admin_count'] },
  {
    id: 'data',
    checks: [
      'storage_secure_transfer',
      'storage_public_access',
      'keyvault_protection',
      'sql_tls',
      'sql_public_access',
      'sql_auditing',
      'data_in_india',
    ],
  },
  { id: 'network', checks: ['nsg_open_ports'] },
] as const satisfies readonly { id: string; checks: readonly AzureCheckId[] }[];

/** `skipped` is a check that could not give an answer: see `SKIPPED_REASONS`. */
export const CONNECTION_CHECK_STATUSES = ['pass', 'warn', 'fail', 'skipped'] as const;
export type ConnectionCheckStatus = (typeof CONNECTION_CHECK_STATUSES)[number];

/** Why a check gave no answer: there was nothing of that kind to check, the connection may not read it, or it failed. */
export const SKIPPED_REASONS = ['none', 'access', 'error'] as const;
export type SkippedReason = (typeof SKIPPED_REASONS)[number];

/** How many resource names one result lists. */
export const CONNECTION_NAMES_SHOWN = 5;
export const CONNECTION_PAGE_SIZE = 10;
export const CONNECTION_RUN_PAGE_SIZE = 10;
/** A connection is not checked again within this time, so a button pressed twice does not call Azure twice. */
export const CONNECTION_RUN_GAP_SECONDS = 30;

/** One thing checked. The words come from the web app; `values` fills in the numbers and names they quote. */
export interface ConnectionCheckResult {
  id: AzureCheckId;
  status: ConnectionCheckStatus;
  reason?: SkippedReason;
  values?: Record<string, string | number>;
}

export interface ConnectionRunSummary {
  id: string;
  connectionId: string;
  ranAt: string;
  ranByName: string;
  passed: number;
  warned: number;
  failed: number;
  skipped: number;
}

export interface ConnectionRunResponse extends ConnectionRunSummary {
  results: ConnectionCheckResult[];
}

export interface ConnectionRunListResponse {
  items: ConnectionRunSummary[];
  total: number;
  page: number;
  pageSize: number;
}

/** A connection as listed. The identifiers say which tenant and subscription it reads; there is no secret here. */
export interface ConnectionSummary {
  id: string;
  provider: ConnectionProvider;
  name: string;
  identifiers: Record<string, string>;
  createdAt: string;
  createdByName: string;
  lastRun: ConnectionRunSummary | null;
}

export interface ConnectionListResponse {
  /** False until whoever runs the install has set `SECRETS_ENCRYPTION_KEY`: credentials cannot be kept without it. */
  enabled: boolean;
  items: ConnectionSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateConnectionRequest {
  provider: ConnectionProvider;
  name: string;
  credentials: Record<string, string>;
}

/** Why Azure would not let the connection in, from the error `CONNECTION_FAILED`. */
export const CONNECTION_FAILURES = ['sign_in', 'subscription', 'unreachable'] as const;
export type ConnectionFailure = (typeof CONNECTION_FAILURES)[number];
