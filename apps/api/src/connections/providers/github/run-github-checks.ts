import {
  GITHUB_CHECK_IDS,
  GITHUB_REPOSITORIES_MAX,
  type CheckId,
  type ConnectionCheckResult,
  type GithubSelection,
} from '@neeti-bharat/shared';
import type { Outcome } from '../outcome';
import { GithubAccessError, cachedGithub, type GithubAccount, type GithubApi } from './github-api';
import { ownerCount, twoFactor } from './checks/org-checks';
import { branchProtection, codeScanning, dependabot, secretScanning } from './checks/repo-checks';
import type { GithubCheck, GithubRepo, GithubScope } from './checks/scope';

const BY_ID = new Map<string, GithubCheck>(
  [twoFactor, ownerCount, branchProtection, codeScanning, secretScanning, dependabot].map(
    (check) => [check.id, check],
  ),
);

/** Every check, in the order the shared list names them. */
export const GITHUB_CHECKS: GithubCheck[] = GITHUB_CHECK_IDS.map((id) => BY_ID.get(id)!);

/** A check that cannot answer is reported as skipped, with the reason, and never stops the others. */
async function attempt(check: GithubCheck, scope: GithubScope): Promise<Outcome> {
  try {
    return await check.run(scope);
  } catch (error) {
    return { status: 'skipped', reason: error instanceof GithubAccessError ? 'access' : 'error' };
  }
}

/** The repositories to read: every one the App can see, or only those picked. Archived ones are left out. */
export async function repositoriesInScope(
  api: GithubApi,
  selection: GithubSelection,
): Promise<GithubRepo[]> {
  const all = await api.list<GithubRepo>('/installation/repositories?per_page=100', 'repositories');
  const picked = new Set(selection.repositories.map((name) => name.toLowerCase()));
  return all
    .filter((repo) => !repo.archived)
    .filter((repo) => selection.mode === 'all' || picked.has(repo.full_name.toLowerCase()))
    .slice(0, GITHUB_REPOSITORIES_MAX);
}

const allSkipped = (checks: GithubCheck[], error: unknown): ConnectionCheckResult[] =>
  checks.map(({ id }) => ({
    id,
    status: 'skipped' as const,
    reason: error instanceof GithubAccessError ? ('access' as const) : ('error' as const),
  }));

/**
 * Runs every check against one connection, or only those in `only`. Reads are shared, so a list that two checks need is
 * fetched once.
 */
export async function runGithubChecks(
  api: GithubApi,
  account: GithubAccount,
  selection: GithubSelection,
  only?: ReadonlySet<CheckId>,
): Promise<ConnectionCheckResult[]> {
  const shared = cachedGithub(api);
  const checks = GITHUB_CHECKS.filter((check) => !only || only.has(check.id));
  try {
    const scope = {
      api: shared,
      account,
      repositories: await repositoriesInScope(shared, selection),
    };
    return await Promise.all(
      checks.map(async (check) => ({ id: check.id, ...(await attempt(check, scope)) })),
    );
  } catch (error) {
    return allSkipped(checks, error);
  }
}
