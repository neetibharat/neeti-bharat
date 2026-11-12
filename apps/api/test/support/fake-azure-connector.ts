import {
  AzureConnector,
  AzureSignInError,
  type AzureApi,
  type AzureCredentials,
} from '../../src/connections/providers/azure/azure-api';
import { fakeAzure } from '../../src/connections/providers/azure/checks/fake-azure';

/** A secret that the fake Azure refuses, so a test can see what happens when Microsoft says no. */
export const REFUSED_SECRET = 'refused-secret';

const GLOBAL_ADMINISTRATOR = '62e90394-69f5-4237-9190-012177145e10';

/** A small, healthy subscription: everything passes, so a run has real results to look at. */
function healthyAzure(): AzureApi {
  return fakeAzure({
    arm: {
      'Microsoft.Storage': [
        {
          name: 'files',
          location: 'centralindia',
          properties: {
            supportsHttpsTrafficOnly: true,
            minimumTlsVersion: 'TLS1_2',
            allowBlobPublicAccess: false,
          },
        },
      ],
      'Microsoft.KeyVault': [],
      'Microsoft.Sql': [],
      networkSecurityGroups: [],
    },
    graph: {
      userRegistrationDetails: [{ userType: 'member', isMfaRegistered: true }],
      identitySecurityDefaultsEnforcementPolicy: { isEnabled: true },
      '/members': [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      '/directoryRoles?': [{ id: 'role-1', roleTemplateId: GLOBAL_ADMINISTRATOR }],
    },
  });
}

/** Stands in for Microsoft in the end-to-end tests: nothing leaves the machine. */
export class FakeAzureConnector extends AzureConnector {
  readonly verified: AzureCredentials[] = [];

  connect(): AzureApi {
    return healthyAzure();
  }

  verify(credentials: AzureCredentials): Promise<void> {
    this.verified.push(credentials);
    return credentials.clientSecret === REFUSED_SECRET
      ? Promise.reject(new AzureSignInError('refused'))
      : Promise.resolve();
  }
}
