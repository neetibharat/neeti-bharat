import { AZURE_CHECK_IDS } from '@dpdp-kit/shared';
import {
  acrAdminUser,
  acrAnonymousPull,
  acrContentTrust,
  acrPublicAccess,
  acrRetention,
  aksAad,
  aksAutoUpgrade,
  aksMonitoring,
  aksNetworkPolicy,
  aksPolicyAddon,
  aksPrivateApi,
  aksRbac,
} from './container-checks';
import {
  vmIdentity,
  vmSecureBoot,
  vmSshPassword,
  webAppFtp,
  webAppHttps,
  webAppIdentity,
  webAppRemoteDebugging,
  webAppTls,
} from './app-checks';
import {
  dataInIndia,
  keyVaultPublicAccess,
  keyVaultPurgeProtection,
  keyVaultRbac,
  keyVaultSoftDelete,
  sqlAuditing,
  sqlFirewall,
  sqlPublicAccess,
  sqlTls,
  storageNetworkAccess,
  storagePublicAccess,
  storageSecureTransfer,
} from './data-checks';
import {
  cosmosBackup,
  cosmosFailover,
  cosmosKeyAccess,
  datastoresPublicAccess,
  flexibleServersTls,
} from './database-checks';
import { adminCount, mfaEnforced, mfaRegistered } from './entra-checks';
import {
  defenderPlans,
  defenderRecommendations,
  environmentSeparation,
  monitorAlerts,
  monitorLogExport,
  policyAssignments,
} from './governance-checks';
import { nsgOpenPorts } from './network-checks';
import type { AzureCheck } from './outcome';
import { encryptionAtRest } from './protection-checks';
import { rbacPrivileged, rbacServicePrincipals, rbacWildcardRoles } from './rbac-checks';

const BY_ID = new Map<string, AzureCheck>(
  [
    mfaRegistered,
    mfaEnforced,
    adminCount,
    rbacPrivileged,
    rbacWildcardRoles,
    rbacServicePrincipals,
    storageSecureTransfer,
    storagePublicAccess,
    storageNetworkAccess,
    encryptionAtRest,
    keyVaultSoftDelete,
    keyVaultPurgeProtection,
    keyVaultPublicAccess,
    keyVaultRbac,
    dataInIndia,
    sqlTls,
    sqlPublicAccess,
    sqlFirewall,
    sqlAuditing,
    flexibleServersTls,
    datastoresPublicAccess,
    cosmosKeyAccess,
    cosmosFailover,
    cosmosBackup,
    webAppHttps,
    webAppTls,
    webAppRemoteDebugging,
    webAppFtp,
    webAppIdentity,
    vmIdentity,
    vmSshPassword,
    vmSecureBoot,
    aksRbac,
    aksAad,
    aksNetworkPolicy,
    aksPrivateApi,
    aksPolicyAddon,
    aksAutoUpgrade,
    aksMonitoring,
    acrAdminUser,
    acrPublicAccess,
    acrAnonymousPull,
    acrContentTrust,
    acrRetention,
    nsgOpenPorts,
    environmentSeparation,
    monitorAlerts,
    monitorLogExport,
    policyAssignments,
    defenderPlans,
    defenderRecommendations,
  ].map((check) => [check.id, check]),
);

/** Every check, in the order the shared list names them. */
export const AZURE_CHECKS: AzureCheck[] = AZURE_CHECK_IDS.map((id) => BY_ID.get(id)!);
