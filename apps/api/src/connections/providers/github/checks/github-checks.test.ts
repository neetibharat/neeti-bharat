import { describe, expect, it } from 'vitest';
import { GithubAccessError, GithubNotFoundError, type GithubApi } from '../github-api';
import { runGithubChecks } from '../run-github-checks';
import { fakeGithub, type FakeGithubData } from './fake-github';
import { ownerCount, twoFactor } from './org-checks';
import { branchProtection, codeScanning, dependabot, secretScanning } from './repo-checks';
import type { GithubScope } from './scope';

const ORG = { login: 'acme', type: 'Organization' as const };
const repos = (...names: string[]) =>
  names.map((full_name) => ({ full_name, default_branch: 'main' }));

const scopeOf = (data: FakeGithubData, names: string[] = ['acme/api']): GithubScope => ({
  api: fakeGithub(data),
  account: ORG,
  repositories: repos(...names),
});

const PROTECTED = { required_pull_request_reviews: { required_approving_review_count: 1 } };

describe('twoFactor', () => {
  const path = '/orgs/acme/members?filter=2fa_disabled&per_page=100';

  it('passes when every member signs in with a second step', async () => {
    expect(await twoFactor.run(scopeOf({ lists: { [path]: [] } }))).toEqual({ status: 'pass' });
  });

  it('fails with a count, and never names the people', async () => {
    const result = await twoFactor.run(
      scopeOf({ lists: { [path]: [{ login: 'asha' }, { login: 'ravi' }] } }),
    );
    expect(result).toEqual({ status: 'fail', values: { count: 2 } });
    expect(JSON.stringify(result)).not.toContain('asha');
  });

  it('says it was not allowed to look, instead of passing', async () => {
    const api: GithubApi = {
      ...fakeGithub(),
      list: () => Promise.reject(new GithubAccessError('no')),
    };
    const result = await twoFactor.run({ api, account: ORG, repositories: [] });
    expect(result).toEqual({ status: 'skipped', reason: 'access' });
  });

  it('has nothing to check on a person’s account, which has no members', async () => {
    const result = await twoFactor.run({
      ...scopeOf({}),
      account: { login: 'asha', type: 'User' },
    });
    expect(result).toEqual({ status: 'skipped', reason: 'none' });
  });
});

describe('ownerCount', () => {
  const path = '/orgs/acme/members?role=admin&per_page=100';
  const owners = (count: number) => Array.from({ length: count }, (_, i) => ({ login: `o${i}` }));

  it.each([
    [1, 'warn'],
    [2, 'pass'],
    [5, 'pass'],
    [6, 'warn'],
  ])('with %i owners is a %s', async (count, status) => {
    const result = await ownerCount.run(scopeOf({ lists: { [path]: owners(count) } }));
    expect(result.status).toBe(status);
    expect(result.values).toMatchObject({ count });
  });
});

describe('branchProtection', () => {
  const classic = '/repos/acme/api/branches/main/protection';
  const rules = '/repos/acme/api/rules/branches/main';

  it('passes when a classic rule requires a review', async () => {
    const result = await branchProtection.run(scopeOf({ gets: { [classic]: PROTECTED } }));
    expect(result.status).toBe('pass');
  });

  it('warns when the branch is protected but needs no review', async () => {
    const result = await branchProtection.run(scopeOf({ gets: { [classic]: {} } }));
    expect(result.status).toBe('warn');
    // What it saw, and the settings page that changes it.
    expect(result.resources).toEqual([
      {
        name: 'acme/api',
        status: 'warn',
        url: 'https://github.com/acme/api/settings/branches',
        found: { branch: 'main', required_approving_review_count: 0 },
      },
    ]);
  });

  it('passes when a ruleset requires a pull request and there is no classic rule', async () => {
    const result = await branchProtection.run(
      scopeOf({ gets: { [rules]: [{ type: 'pull_request' }] } }),
    );
    expect(result.status).toBe('pass');
  });

  it('fails, and names the repository, when nothing protects the default branch', async () => {
    const result = await branchProtection.run(
      scopeOf({ gets: { [rules]: [] } }, ['acme/api', 'acme/web']),
    );
    expect(result.status).toBe('fail');
    expect(result.resources?.map((resource) => resource.name)).toEqual(['acme/api', 'acme/web']);
  });

  it('says it was not allowed to look when GitHub refuses every repository', async () => {
    const result = await branchProtection.run(
      scopeOf({ gets: { [classic]: new GithubAccessError('plan') } }),
    );
    expect(result).toEqual({ status: 'skipped', reason: 'access' });
  });

  it('has nothing to check when there are no repositories', async () => {
    const result = await branchProtection.run(scopeOf({}, []));
    expect(result).toEqual({ status: 'skipped', reason: 'none' });
  });
});

describe('secretScanning', () => {
  const settings = (scanning?: string, push?: string) => ({
    '/repos/acme/api': {
      security_and_analysis: {
        ...(scanning && { secret_scanning: { status: scanning } }),
        ...(push && { secret_scanning_push_protection: { status: push } }),
      },
    },
  });

  it.each([
    ['enabled', 'enabled', 'pass'],
    ['enabled', 'disabled', 'warn'],
    ['disabled', 'disabled', 'fail'],
  ])('scanning %s with push protection %s is a %s', async (scanning, push, status) => {
    const result = await secretScanning.run(scopeOf({ gets: settings(scanning, push) }));
    expect(result.status).toBe(status);
  });

  it('is not allowed to judge a repository that does not report the setting', async () => {
    const result = await secretScanning.run(scopeOf({ gets: settings() }));
    expect(result).toEqual({ status: 'skipped', reason: 'access' });
  });
});

describe('dependabot', () => {
  it('passes with alerts on, and fails with them off', async () => {
    const path = '/repos/acme/api/vulnerability-alerts';
    expect((await dependabot.run(scopeOf({ statuses: { [path]: 204 } }))).status).toBe('pass');
    expect((await dependabot.run(scopeOf({ statuses: { [path]: 404 } }))).status).toBe('fail');
  });

  it('is not allowed to judge a repository GitHub will not answer for', async () => {
    const result = await dependabot.run(
      scopeOf({ statuses: { '/repos/acme/api/vulnerability-alerts': 403 } }),
    );
    expect(result).toEqual({ status: 'skipped', reason: 'access' });
  });
});

describe('codeScanning', () => {
  const setup = '/repos/acme/api/code-scanning/default-setup';
  const analyses = '/repos/acme/api/code-scanning/analyses?per_page=1';

  it('passes with the default setup, or with results uploaded by a workflow', async () => {
    expect(
      (await codeScanning.run(scopeOf({ gets: { [setup]: { state: 'configured' } } }))).status,
    ).toBe('pass');
    expect(
      (
        await codeScanning.run(
          scopeOf({ gets: { [setup]: { state: 'not-configured' }, [analyses]: [{ id: 1 }] } }),
        )
      ).status,
    ).toBe('pass');
  });

  it('warns when there is no scanning at all', async () => {
    const result = await codeScanning.run(
      scopeOf({ gets: { [setup]: new GithubNotFoundError('none'), [analyses]: [] } }),
    );
    expect(result.status).toBe('warn');
  });
});

describe('runGithubChecks', () => {
  const healthy: FakeGithubData = {
    lists: {
      '/installation/repositories?per_page=100': [
        { full_name: 'acme/api', default_branch: 'main' },
        { full_name: 'acme/old', default_branch: 'main', archived: true },
        { full_name: 'acme/web', default_branch: 'main' },
      ],
      '/orgs/acme/members?filter=2fa_disabled&per_page=100': [],
      '/orgs/acme/members?role=admin&per_page=100': [{ login: 'a' }, { login: 'b' }],
    },
    gets: {
      '/repos/acme/api/branches/main/protection': PROTECTED,
      '/repos/acme/web/branches/main/protection': PROTECTED,
      '/repos/acme/api': {
        security_and_analysis: {
          secret_scanning: { status: 'enabled' },
          secret_scanning_push_protection: { status: 'enabled' },
        },
      },
      '/repos/acme/web': {
        security_and_analysis: {
          secret_scanning: { status: 'enabled' },
          secret_scanning_push_protection: { status: 'enabled' },
        },
      },
      '/repos/acme/api/code-scanning/default-setup': { state: 'configured' },
      '/repos/acme/web/code-scanning/default-setup': { state: 'configured' },
    },
    statuses: {
      '/repos/acme/api/vulnerability-alerts': 204,
      '/repos/acme/web/vulnerability-alerts': 204,
    },
  };

  it('runs every check, one result each, and leaves archived repositories out', async () => {
    const results = await runGithubChecks(fakeGithub(healthy), ORG, {
      mode: 'all',
      repositories: [],
    });
    expect(results.map((result) => result.id)).toHaveLength(6);
    expect(results.every((result) => result.status === 'pass')).toBe(true);
    expect(JSON.stringify(results)).not.toContain('acme/old');
  });

  it('reads only the repositories that were picked', async () => {
    const results = await runGithubChecks(
      fakeGithub({
        ...healthy,
        statuses: { '/repos/acme/api/vulnerability-alerts': 404 },
      }),
      ORG,
      { mode: 'selected', repositories: ['ACME/web'] },
    );
    const alerts = results.find((result) => result.id === 'github_dependabot');
    // acme/api, which has alerts off, was not picked, and acme/web has no answer here, so it is the only one read.
    expect(alerts?.resources?.map((resource) => resource.name)).toEqual(['acme/web']);
  });

  it('shows every check as not checked when the repositories cannot be read', async () => {
    const api: GithubApi = {
      ...fakeGithub(),
      list: () => Promise.reject(new GithubAccessError('no')),
    };
    const results = await runGithubChecks(api, ORG, { mode: 'all', repositories: [] });
    expect(results).toHaveLength(6);
    expect(results.every((r) => r.status === 'skipped' && r.reason === 'access')).toBe(true);
  });

  it('lets one check fail without stopping the others', async () => {
    const results = await runGithubChecks(
      fakeGithub({
        ...healthy,
        lists: { ...healthy.lists, '/orgs/acme/members?role=admin&per_page=100': [{ login: 'a' }] },
      }),
      ORG,
      { mode: 'all', repositories: [] },
    );
    expect(results.find((r) => r.id === 'github_owner_count')?.status).toBe('warn');
    expect(results.find((r) => r.id === 'github_two_factor')?.status).toBe('pass');
  });
});
