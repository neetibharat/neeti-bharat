import { AZURE_CHECK_IDS } from '@dpdp-kit/shared';
import {
  dataInIndia,
  keyVaultProtection,
  sqlAuditing,
  sqlPublicAccess,
  sqlTls,
  storagePublicAccess,
  storageSecureTransfer,
} from './data-checks';
import { adminCount, mfaEnforced, mfaRegistered } from './entra-checks';
import { nsgOpenPorts } from './network-checks';
import type { AzureCheck } from './outcome';

const BY_ID = new Map<string, AzureCheck>(
  [
    mfaRegistered,
    mfaEnforced,
    adminCount,
    storageSecureTransfer,
    storagePublicAccess,
    keyVaultProtection,
    sqlTls,
    sqlPublicAccess,
    sqlAuditing,
    dataInIndia,
    nsgOpenPorts,
  ].map((check) => [check.id, check]),
);

/** Every check, in the order the shared list names them. */
export const AZURE_CHECKS: AzureCheck[] = AZURE_CHECK_IDS.map((id) => BY_ID.get(id)!);
