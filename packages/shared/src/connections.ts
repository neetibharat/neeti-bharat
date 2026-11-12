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
  'rbac_privileged',
  'rbac_wildcard_roles',
  'rbac_service_principals',
  'storage_secure_transfer',
  'storage_public_access',
  'storage_network_access',
  'encryption_at_rest',
  'keyvault_soft_delete',
  'keyvault_purge_protection',
  'keyvault_public_access',
  'keyvault_rbac',
  'data_in_india',
  'sql_tls',
  'sql_public_access',
  'sql_firewall',
  'sql_auditing',
  'flexible_servers_tls',
  'datastores_public_access',
  'cosmos_key_access',
  'cosmos_failover',
  'cosmos_backup',
  'webapp_https',
  'webapp_tls',
  'webapp_remote_debugging',
  'webapp_ftp',
  'webapp_identity',
  'vm_identity',
  'vm_ssh_password',
  'vm_secure_boot',
  'aks_rbac',
  'aks_aad',
  'aks_network_policy',
  'aks_private_api',
  'aks_policy_addon',
  'aks_auto_upgrade',
  'aks_monitoring',
  'acr_admin_user',
  'acr_public_access',
  'acr_anonymous_pull',
  'acr_content_trust',
  'acr_retention',
  'nsg_open_ports',
  'environment_separation',
  'monitor_alerts',
  'monitor_log_export',
  'policy_assignments',
  'defender_plans',
  'defender_recommendations',
] as const;
export type AzureCheckId = (typeof AZURE_CHECK_IDS)[number];

/** The checks in groups, as the results page lists them. */
export const AZURE_CHECK_GROUPS = [
  {
    id: 'identity',
    checks: [
      'entra_mfa_registered',
      'entra_mfa_enforced',
      'entra_admin_count',
      'rbac_privileged',
      'rbac_wildcard_roles',
      'rbac_service_principals',
    ],
  },
  {
    id: 'data',
    checks: [
      'storage_secure_transfer',
      'storage_public_access',
      'storage_network_access',
      'encryption_at_rest',
      'keyvault_soft_delete',
      'keyvault_purge_protection',
      'keyvault_public_access',
      'keyvault_rbac',
      'data_in_india',
    ],
  },
  {
    id: 'databases',
    checks: [
      'sql_tls',
      'sql_public_access',
      'sql_firewall',
      'sql_auditing',
      'flexible_servers_tls',
      'datastores_public_access',
      'cosmos_key_access',
      'cosmos_failover',
      'cosmos_backup',
    ],
  },
  {
    id: 'apps',
    checks: [
      'webapp_https',
      'webapp_tls',
      'webapp_remote_debugging',
      'webapp_ftp',
      'webapp_identity',
      'vm_identity',
      'vm_ssh_password',
      'vm_secure_boot',
    ],
  },
  {
    id: 'containers',
    checks: [
      'aks_rbac',
      'aks_aad',
      'aks_network_policy',
      'aks_private_api',
      'aks_policy_addon',
      'aks_auto_upgrade',
      'aks_monitoring',
      'acr_admin_user',
      'acr_public_access',
      'acr_anonymous_pull',
      'acr_content_trust',
      'acr_retention',
    ],
  },
  {
    id: 'network',
    checks: ['nsg_open_ports'],
  },
  {
    id: 'governance',
    checks: [
      'environment_separation',
      'monitor_alerts',
      'monitor_log_export',
      'policy_assignments',
      'defender_plans',
      'defender_recommendations',
    ],
  },
] as const satisfies readonly { id: string; checks: readonly AzureCheckId[] }[];

/** How serious it is when a check does not pass. It is a judgement about the check, not about one account. */
export const CHECK_SEVERITIES = ['high', 'medium', 'low'] as const;
export type CheckSeverity = (typeof CHECK_SEVERITIES)[number];

export const AZURE_CHECK_SEVERITY: Readonly<Record<AzureCheckId, CheckSeverity>> = {
  entra_mfa_registered: 'high',
  entra_mfa_enforced: 'high',
  rbac_wildcard_roles: 'high',
  storage_secure_transfer: 'high',
  storage_public_access: 'high',
  encryption_at_rest: 'high',
  keyvault_soft_delete: 'high',
  sql_tls: 'high',
  sql_firewall: 'high',
  sql_auditing: 'high',
  flexible_servers_tls: 'high',
  webapp_https: 'high',
  webapp_tls: 'high',
  webapp_remote_debugging: 'high',
  webapp_ftp: 'high',
  aks_rbac: 'high',
  acr_admin_user: 'high',
  acr_anonymous_pull: 'high',
  nsg_open_ports: 'high',
  entra_admin_count: 'medium',
  rbac_privileged: 'medium',
  rbac_service_principals: 'medium',
  storage_network_access: 'medium',
  keyvault_purge_protection: 'medium',
  keyvault_public_access: 'medium',
  data_in_india: 'medium',
  sql_public_access: 'medium',
  datastores_public_access: 'medium',
  cosmos_key_access: 'medium',
  vm_ssh_password: 'medium',
  aks_aad: 'medium',
  aks_network_policy: 'medium',
  aks_private_api: 'medium',
  aks_auto_upgrade: 'medium',
  aks_monitoring: 'medium',
  acr_public_access: 'medium',
  environment_separation: 'medium',
  monitor_alerts: 'medium',
  monitor_log_export: 'medium',
  policy_assignments: 'medium',
  defender_recommendations: 'medium',
  keyvault_rbac: 'low',
  cosmos_failover: 'low',
  cosmos_backup: 'low',
  webapp_identity: 'low',
  vm_identity: 'low',
  vm_secure_boot: 'low',
  aks_policy_addon: 'low',
  acr_content_trust: 'low',
  acr_retention: 'low',
  defender_plans: 'low',
};

/** `skipped` is a check that could not give an answer: see `SKIPPED_REASONS`. */
export const CONNECTION_CHECK_STATUSES = ['pass', 'warn', 'fail', 'skipped'] as const;
export type ConnectionCheckStatus = (typeof CONNECTION_CHECK_STATUSES)[number];

/** Why a check gave no answer: there was nothing of that kind to check, the connection may not read it, or it failed. */
export const SKIPPED_REASONS = ['none', 'access', 'error'] as const;
export type SkippedReason = (typeof SKIPPED_REASONS)[number];

/** How many resource names one result lists in a sentence. */
export const CONNECTION_NAMES_SHOWN = 5;
/** How many of the resources that did not pass one result keeps, to be listed under it. */
export const CONNECTION_RESOURCES_KEPT = 200;
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
  /** The resources that did not pass, with how each one did not, up to `CONNECTION_RESOURCES_KEPT`. */
  resources?: { name: string; status: 'warn' | 'fail' }[];
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
