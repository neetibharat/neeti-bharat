import type { Verdict } from '../../outcome';
import { GithubAccessError, GithubNotFoundError } from '../github-api';
import { judgeRepos, type GithubCheck, type GithubRepo, type GithubScope } from './scope';

interface Protection {
  required_pull_request_reviews?: { required_approving_review_count?: number };
}

interface Rule {
  type: string;
}

interface Settings {
  security_and_analysis?: {
    secret_scanning?: { status?: string };
    secret_scanning_push_protection?: { status?: string };
  };
}

const path = (repo: GithubRepo, rest: string): string => `/repos/${repo.full_name}${rest}`;

const BRANCHES = 'branches';
const SECURITY = 'security_analysis';

/** Reads a thing that may simply not be there: a 404 is an answer, and gives `undefined`. */
async function readOrNothing<T>(read: () => Promise<T>): Promise<T | undefined> {
  try {
    return await read();
  } catch (error) {
    if (error instanceof GithubNotFoundError) return undefined;
    throw error;
  }
}

/** A ruleset that requires a pull request is enough; any other ruleset is a start; none at all is a failure. */
function rulesetVerdict(rules: Rule[]): Verdict {
  if (rules.some((rule) => rule.type === 'pull_request')) return 'ok';
  return rules.length > 0 ? 'warn' : 'fail';
}

/** A review is required before anything reaches the default branch: by a classic rule, or by a ruleset. */
export const branchProtection: GithubCheck = {
  id: 'github_branch_protection',
  run: (scope: GithubScope) =>
    judgeRepos(scope, async (repo) => {
      const branch = encodeURIComponent(repo.default_branch ?? 'main');
      const classic = await readOrNothing(() =>
        scope.api.get<Protection>(path(repo, `/branches/${branch}/protection`)),
      );
      if (classic) {
        const reviews = classic.required_pull_request_reviews?.required_approving_review_count ?? 0;
        return {
          verdict: reviews >= 1 ? 'ok' : 'warn',
          found: { branch: repo.default_branch, required_approving_review_count: reviews },
          page: BRANCHES,
        };
      }
      const rules =
        (await readOrNothing(() =>
          scope.api.get<Rule[]>(path(repo, `/rules/branches/${branch}`)),
        )) ?? [];
      return {
        verdict: rulesetVerdict(rules),
        found: { branch: repo.default_branch, rules: rules.map((rule) => rule.type).join(', ') },
        page: BRANCHES,
      };
    }),
};

/** Secret scanning is on, and push protection stops a secret before it is pushed. */
export const secretScanning: GithubCheck = {
  id: 'github_secret_scanning',
  run: (scope: GithubScope) =>
    judgeRepos(scope, async (repo) => {
      const analysis = (await scope.api.get<Settings>(path(repo, ''))).security_and_analysis;
      // Repositories the App may not administer, or a plan without the feature, do not report these settings.
      if (!analysis?.secret_scanning) return null;
      const scanning = analysis.secret_scanning.status;
      const push = analysis.secret_scanning_push_protection?.status;
      const verdict: Verdict = scanning !== 'enabled' ? 'fail' : push === 'enabled' ? 'ok' : 'warn';
      return {
        verdict,
        found: { secret_scanning: scanning, secret_scanning_push_protection: push },
        page: SECURITY,
      };
    }),
};

/** Dependabot alerts are on, so a known weakness in a library is flagged. */
export const dependabot: GithubCheck = {
  id: 'github_dependabot',
  run: (scope: GithubScope) =>
    judgeRepos(scope, async (repo) => {
      const status = await scope.api.status(path(repo, '/vulnerability-alerts'));
      if (status !== 204 && status !== 404) throw new GithubAccessError(`Not allowed (${status})`);
      const on = status === 204;
      return { verdict: on ? 'ok' : 'fail', found: { vulnerability_alerts: on }, page: SECURITY };
    }),
};

/** Code scanning is set up, by GitHub's default setup or by a workflow that uploads its results. */
export const codeScanning: GithubCheck = {
  id: 'github_code_scanning',
  run: (scope: GithubScope) =>
    judgeRepos(scope, async (repo) => {
      const setup = await readOrNothing(() =>
        scope.api.get<{ state?: string }>(path(repo, '/code-scanning/default-setup')),
      );
      const configured = setup?.state === 'configured';
      const analyses = configured
        ? undefined
        : await readOrNothing(() =>
            scope.api.get<unknown[]>(path(repo, '/code-scanning/analyses?per_page=1')),
          );
      const uploaded = (analyses?.length ?? 0) > 0;
      return {
        verdict: configured || uploaded ? 'ok' : 'warn',
        found: { default_setup: setup?.state, uploaded_analyses: uploaded },
        page: SECURITY,
      };
    }),
};
