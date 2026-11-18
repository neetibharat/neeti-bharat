import {
  GithubConnector,
  GithubSignInError,
  type GithubAccount,
  type GithubApi,
  type GithubApp,
  type GithubCredentials,
  type GithubInstallationInfo,
  type GithubRepositoryInfo,
} from '../../src/connections/providers/github/github-api';
import { fakeGithub } from '../../src/connections/providers/github/checks/fake-github';

/** A private key that the fake GitHub refuses, so a test can see what happens when GitHub says no. */
export const REFUSED_KEY =
  '-----BEGIN RSA PRIVATE KEY-----\nrefused\n-----END RSA PRIVATE KEY-----';
export const GOOD_KEY = '-----BEGIN RSA PRIVATE KEY-----\ngood\n-----END RSA PRIVATE KEY-----';

const REPOSITORIES: GithubRepositoryInfo[] = [
  { name: 'acme/api', isPrivate: true },
  { name: 'acme/web', isPrivate: false },
];

const ACCOUNT: GithubAccount = { login: 'acme', type: 'Organization' };

/** One healthy repository, and an organisation with three owners and no one without two-factor sign-in. */
function healthyGithub(): GithubApi {
  return fakeGithub({
    lists: {
      '/installation/repositories?per_page=100': [
        { full_name: 'acme/api', default_branch: 'main' },
        { full_name: 'acme/web', default_branch: 'main' },
      ],
      '/orgs/acme/members?filter=2fa_disabled&per_page=100': [],
      '/orgs/acme/members?role=admin&per_page=100': [
        { login: 'a' },
        { login: 'b' },
        { login: 'c' },
      ],
    },
    gets: Object.fromEntries(
      REPOSITORIES.flatMap(({ name }) => [
        [
          `/repos/${name}/branches/main/protection`,
          { required_pull_request_reviews: { required_approving_review_count: 1 } },
        ],
        [
          `/repos/${name}`,
          {
            security_and_analysis: {
              secret_scanning: { status: 'enabled' },
              secret_scanning_push_protection: { status: 'enabled' },
            },
          },
        ],
        [`/repos/${name}/code-scanning/default-setup`, { state: 'configured' }],
      ]),
    ),
    statuses: Object.fromEntries(
      REPOSITORIES.map(({ name }) => [`/repos/${name}/vulnerability-alerts`, 204]),
    ),
  });
}

/** Stands in for GitHub in the end-to-end tests: nothing leaves the machine. */
export class FakeGithubConnector extends GithubConnector {
  readonly verified: GithubCredentials[] = [];

  connect(): GithubApi {
    return healthyGithub();
  }

  async verify(credentials: GithubCredentials): Promise<GithubAccount> {
    this.verified.push(credentials);
    if (credentials.privateKey === REFUSED_KEY) throw new GithubSignInError('refused');
    return ACCOUNT;
  }

  async discover(app: GithubApp): Promise<GithubInstallationInfo[]> {
    if (app.privateKey === REFUSED_KEY) throw new GithubSignInError('refused');
    return [{ id: '4242', account: ACCOUNT, repositories: REPOSITORIES }];
  }

  async repositories(): Promise<GithubRepositoryInfo[]> {
    return REPOSITORIES;
  }
}

export const githubConnector = new FakeGithubConnector();
