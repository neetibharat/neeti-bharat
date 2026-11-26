import type { ConnectionCheckResult } from '@neeti-bharat/shared';
import type { AzureApi } from '../azure-api';
import type { Outcome } from '../../outcome';

export {
  judge,
  nothingToCheck,
  type Described,
  type Found,
  type Outcome,
  type Verdict,
} from '../../outcome';

export interface AzureCheck {
  id: ConnectionCheckResult['id'];
  run: (api: AzureApi, subscriptionId: string) => Promise<Outcome>;
}

/** The path of a subscription's resources of one kind. */
export const resourcesPath = (subscriptionId: string, kind: string, apiVersion: string): string =>
  `/subscriptions/${subscriptionId}/providers/${kind}?api-version=${apiVersion}`;
