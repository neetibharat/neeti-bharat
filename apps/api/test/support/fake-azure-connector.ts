import {
  AzureConnector,
  AzureSignInError,
  type AzureApi,
  type AzureApp,
  type AzureCredentials,
  type FoundSubscription,
} from '../../src/connections/providers/azure/azure-api';
import { fakeAzure } from '../../src/connections/providers/azure/checks/fake-azure';

/** A secret that the fake Azure refuses, so a test can see what happens when Microsoft says no. */
export const REFUSED_SECRET = 'refused-secret';

const GLOBAL_ADMINISTRATOR = '62e90394-69f5-4237-9190-012177145e10';

/** One healthy storage account, and nothing of the other kinds, which a check reports as nothing to check. */
const EMPTY_KINDS = [
  'Microsoft.KeyVault',
  'Microsoft.Sql',
  'Microsoft.DBforPostgreSQL',
  'Microsoft.DBforMySQL',
  'Microsoft.DocumentDB',
  'Microsoft.Cache',
  'Microsoft.Web/sites',
  'Microsoft.Compute',
  'Microsoft.ContainerService',
  'Microsoft.ContainerRegistry',
  'networkSecurityGroups',
  'roleAssignments',
  'roleDefinitions',
  'activityLogAlerts',
  'diagnosticSettings',
  'Microsoft.Security/pricings',
  'Microsoft.Security/assessments',
];

const HEALTHY_STORAGE = {
  name: 'files',
  location: 'centralindia',
  properties: {
    supportsHttpsTrafficOnly: true,
    minimumTlsVersion: 'TLS1_2',
    allowBlobPublicAccess: false,
  },
};

/** A small, healthy subscription: what is there passes, so a run has real results to look at. */
function healthyAzure(): AzureApi {
  return fakeAzure({
    arm: {
      'Microsoft.Storage': [HEALTHY_STORAGE],
      ...Object.fromEntries(EMPTY_KINDS.map((kind) => [kind, []])),
      policyAssignments: [{}],
      resourcegroups: [{ name: 'rg-shop-prod' }, { name: 'rg-shop-dev' }],
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
  /** How long Microsoft takes to answer, in milliseconds, so a test can see what a slow answer does. */
  delayMs = 0;

  connect(): AzureApi {
    return healthyAzure();
  }

  async subscriptions(app: AzureApp): Promise<FoundSubscription[]> {
    if (app.clientSecret === REFUSED_SECRET) throw new AzureSignInError('refused');
    return [
      {
        subscriptionId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        displayName: 'Production',
        state: 'Enabled',
      },
      {
        subscriptionId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        displayName: 'Archive',
        state: 'Enabled',
      },
    ];
  }

  async verify(credentials: AzureCredentials): Promise<void> {
    this.verified.push(credentials);
    if (this.delayMs > 0) await new Promise((done) => setTimeout(done, this.delayMs));
    if (credentials.clientSecret === REFUSED_SECRET) throw new AzureSignInError('refused');
  }
}

/** The one fake the end-to-end app is built with, so a test can reach it. */
export const azureConnector = new FakeAzureConnector();
