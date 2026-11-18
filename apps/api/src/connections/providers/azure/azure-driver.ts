import type { ConnectionCheckResult } from '@dpdp-kit/shared';
import { identifiersOf } from '../../utils/connection-mapper';
import type { ConnectionDriver, Credentials, Identifiers } from '../connection-driver';
import { type AzureConnector, type AzureCredentials } from './azure-api';
import { runAzureChecks } from './run-azure-checks';

/** Reads an Azure subscription with an app registration. */
export class AzureDriver implements ConnectionDriver {
  constructor(private readonly azure: AzureConnector) {}

  async verify(credentials: Credentials): Promise<Identifiers> {
    const azure = credentials as unknown as AzureCredentials;
    await this.azure.verify(azure);
    return identifiersOf(azure);
  }

  check(credentials: Credentials): Promise<ConnectionCheckResult[]> {
    const azure = credentials as unknown as AzureCredentials;
    return runAzureChecks(this.azure.connect(azure), azure.subscriptionId);
  }
}
