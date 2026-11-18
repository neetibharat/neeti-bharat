import type { ConnectionCheckResult, GithubSelection } from '@dpdp-kit/shared';
import type { ConnectionDriver, Credentials, Identifiers } from '../connection-driver';
import type { GithubConnector, GithubCredentials } from './github-api';
import { runGithubChecks } from './run-github-checks';

/** What a GitHub connection keeps in the clear about which repositories it reads. */
export function selectionOf(identifiers: Identifiers): GithubSelection {
  const names = (identifiers.repositories ?? '').split(',').filter(Boolean);
  return identifiers.mode === 'selected'
    ? { mode: 'selected', repositories: names }
    : { mode: 'all', repositories: [] };
}

const identifiersFor = (
  { appId, installationId }: GithubCredentials,
  account: { login: string; type: string },
  selection: GithubSelection,
): Identifiers => ({
  appId,
  installationId,
  account: account.login,
  accountType: account.type,
  mode: selection.mode,
  // A name on GitHub cannot hold a comma, so a comma tells one from the next.
  repositories: selection.mode === 'selected' ? selection.repositories.join(',') : '',
});

/** Reads the repositories and the organisation a GitHub App is installed on. */
export class GithubDriver implements ConnectionDriver {
  constructor(private readonly github: GithubConnector) {}

  async verify(credentials: Credentials, selection?: GithubSelection): Promise<Identifiers> {
    const github = credentials as unknown as GithubCredentials;
    const account = await this.github.verify(github);
    return identifiersFor(github, account, selection ?? { mode: 'all', repositories: [] });
  }

  check(credentials: Credentials, identifiers: Identifiers): Promise<ConnectionCheckResult[]> {
    const account = {
      login: identifiers.account ?? '',
      type: identifiers.accountType === 'User' ? ('User' as const) : ('Organization' as const),
    };
    return runGithubChecks(
      this.github.connect(credentials as unknown as GithubCredentials),
      account,
      selectionOf(identifiers),
    );
  }
}
