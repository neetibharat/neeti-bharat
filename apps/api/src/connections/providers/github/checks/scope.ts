import type { GithubCheckId } from '@dpdp-kit/shared';
import { judge, nothingToCheck, type Outcome, type Verdict } from '../../outcome';
import { GithubAccessError, type GithubAccount, type GithubApi } from '../github-api';

/** A repository as GitHub lists it. */
export interface GithubRepo {
  full_name: string;
  default_branch?: string;
  archived?: boolean;
}

/** What a check reads: the connection, the account it is installed on, and the repositories in scope. */
export interface GithubScope {
  api: GithubApi;
  account: GithubAccount;
  repositories: GithubRepo[];
}

export interface GithubCheck {
  id: GithubCheckId;
  run: (scope: GithubScope) => Promise<Outcome>;
}

/** How many repositories are read at the same time, so a large organisation does not flood GitHub. */
const CONCURRENCY = 5;

/** Runs `work` on every item, a few at a time, and gives the answers in the order of the items. */
export async function mapLimit<T, R>(
  items: readonly T[],
  work: (item: T) => Promise<R>,
): Promise<R[]> {
  const answers: R[] = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const index = next++;
      answers[index] = await work(items[index]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker));
  return answers;
}

/** `null` is a repository that cannot be judged because the App may not read what the check needs. */
export type RepoVerdict = Verdict | null;

/**
 * Judges each repository. One the App may not read is left out, and if that is all of them the check says it was not
 * allowed to look, instead of passing a check that never ran.
 */
export async function judgeRepos(
  scope: GithubScope,
  verdictOf: (repo: GithubRepo) => Promise<RepoVerdict>,
): Promise<Outcome> {
  if (scope.repositories.length === 0) return nothingToCheck;
  const judged = await mapLimit(scope.repositories, async (repo) => ({
    repo,
    verdict: await verdictOf(repo).catch((error: unknown) => {
      if (error instanceof GithubAccessError) return null;
      throw error;
    }),
  }));
  const known = judged.filter((item) => item.verdict !== null);
  if (known.length === 0) return { status: 'skipped', reason: 'access' };
  return judge(
    known,
    (item) => item.verdict as Verdict,
    (item) => item.repo.full_name,
  );
}
