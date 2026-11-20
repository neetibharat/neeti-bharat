import type {
  ConnectionCheckResult,
  ConnectionFailure,
  ConnectionProvider,
  ConnectionRunResponse,
  ConnectionRunSummary,
  ConnectionSchedule,
  ConnectionSummary,
} from '@dpdp-kit/shared';
import type { Connection, ConnectionRun } from '../../generated/prisma/client';
import type { ConnectionRunSummaryRow } from '../repositories/connection-run.repository';
import {
  AzureAccessError,
  AzureSignInError,
  type AzureCredentials,
} from '../providers/azure/azure-api';
import {
  GithubAccessError,
  GithubNotFoundError,
  GithubSignInError,
} from '../providers/github/github-api';

export const toRunSummary = (row: ConnectionRunSummaryRow): ConnectionRunSummary => ({
  id: row.id,
  connectionId: row.connectionId,
  ranAt: row.ranAt.toISOString(),
  ranByName: row.ranByName,
  bySchedule: row.bySchedule,
  passed: row.passed,
  warned: row.warned,
  failed: row.failed,
  skipped: row.skipped,
});

// The results were written by the service in this shape, so they are read back as they were saved.
export const toRunResponse = (row: ConnectionRun): ConnectionRunResponse => ({
  ...toRunSummary(row),
  results: row.results as unknown as ConnectionCheckResult[],
});

export const toSummary = (
  row: Connection,
  lastRun: ConnectionRunSummaryRow | undefined,
): ConnectionSummary => ({
  id: row.id,
  provider: row.provider as ConnectionProvider,
  name: row.name,
  identifiers: row.identifiers as Record<string, string>,
  createdAt: row.createdAt.toISOString(),
  createdByName: row.createdByName,
  schedule: row.schedule as ConnectionSchedule,
  scheduleFailedAt: row.scheduleFailedAt?.toISOString() ?? null,
  lastRun: lastRun ? toRunSummary(lastRun) : null,
});

/** The part of the credentials that is not secret, kept in the clear so the list can say what a connection reads. */
export const identifiersOf = ({
  tenantId,
  clientId,
  subscriptionId,
}: AzureCredentials): Record<string, string> => ({ tenantId, clientId, subscriptionId });

/** Why Azure would not let the connection in, in the terms the person can act on. */
export function failureOf(error: unknown): ConnectionFailure {
  if (error instanceof AzureSignInError || error instanceof GithubSignInError) return 'sign_in';
  if (
    error instanceof AzureAccessError ||
    error instanceof GithubAccessError ||
    error instanceof GithubNotFoundError
  ) {
    return 'subscription';
  }
  return 'unreachable';
}
