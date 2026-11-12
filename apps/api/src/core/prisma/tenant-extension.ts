import { Prisma } from '../../generated/prisma/client';

/** The models whose rows belong to one organisation. Every read and write on them is limited to the request's. */
export const TENANT_MODELS: ReadonlySet<string> = new Set([
  'ProfileEntry',
  'Framework',
  'Requirement',
  'Control',
  'ProofRequirement',
  'Evidence',
  'Policy',
  'ControlPolicyLink',
  'PolicyApproval',
  'Person',
  'RoleAssignment',
  'ActivityEvent',
  'ActivityAnchor',
  'Breach',
  'BreachStepRecord',
  'DataRequest',
  'DataRequestTask',
  'WebsiteCheck',
  'ReadinessCheck',
  'CompanyLogo',
]);

/** Reads, changes and deletes that find rows by a filter. */
const FILTERED = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'updateMany',
  'updateManyAndReturn',
  'deleteMany',
]);

/** Reads, changes and deletes that find one row by its key. */
const BY_KEY = new Set(['findUnique', 'findUniqueOrThrow', 'update', 'delete', 'upsert']);

type Args = Record<string, unknown> & { where?: Record<string, unknown> };

/**
 * Limits what a query finds to the organisation. A filter that names another organisation is overridden, so it cannot
 * be used to reach into one.
 */
export function scopeArgs(operation: string, args: Args | undefined, organizationId: string): Args {
  const next: Args = { ...args };
  if (FILTERED.has(operation) || BY_KEY.has(operation)) {
    next.where = { ...next.where, organizationId };
  }
  return next;
}

const rowsOf = (data: unknown): unknown[] => (Array.isArray(data) ? data : [data]);

/**
 * Refuses a row created for another organisation. What a new row says it belongs to is written by the repository, where
 * the compiler insists on it, so this only has to catch a mistake: the wrong organisation, however it got there.
 */
export function assertOwnRows(
  operation: string,
  args: Args | undefined,
  organizationId: string,
): void {
  const data = [
    ...(operation === 'create' || operation.startsWith('createMany') ? rowsOf(args?.data) : []),
    ...(operation === 'upsert' ? rowsOf(args?.create) : []),
  ];
  for (const row of data) {
    if ((row as { organizationId?: unknown }).organizationId !== organizationId) {
      throw new Error('A row was about to be saved for an organisation other than the request');
    }
  }
}

/**
 * Keeps one organisation's data out of another's. Every query on a tenant model is limited to the request's
 * organisation, so a repository cannot forget the filter, and a request with no organisation fails instead of reading
 * everything.
 */
export function tenantExtension(organizationId: () => string) {
  return Prisma.defineExtension({
    name: 'tenant',
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.has(model)) return query(args);
          const organization = organizationId();
          assertOwnRows(operation, args as Args, organization);
          return query(scopeArgs(operation, args as Args, organization) as typeof args);
        },
      },
    },
  });
}
