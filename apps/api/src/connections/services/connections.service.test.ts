import { randomBytes } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import { runInOrganization } from '../../core/org/org-context';
import { AesSecretBox, DisabledSecretBox, type SecretBox } from '../../core/secrets/secret-box';
import { AzureSignInError, type AzureConnector } from '../providers/azure/azure-api';
import { GithubSignInError, type GithubConnector } from '../providers/github/github-api';
import { fakeAzure } from '../providers/azure/checks/fake-azure';
import { ConnectionDrivers } from '../providers/connection-drivers';
import type { ConnectionRunRepository } from '../repositories/connection-run.repository';
import type { ConnectionRepository } from '../repositories/connection.repository';
import type { ProofSnapshotService } from '../../frameworks/services/proof-snapshot.service';
import type { CheckAcceptanceService } from './check-acceptance.service';
import { ConnectionRunService } from './connection-run.service';
import { ConnectionsService } from './connections.service';

const actor = { id: 'u1', label: 'Asha' };
const credentials = {
  tenantId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  clientId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  subscriptionId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  clientSecret: 'super-secret-value',
};
const input = { provider: 'azure' as const, name: 'Production', credentials };

function build(
  options: {
    secrets?: SecretBox;
    verify?: () => Promise<void>;
    lastRanAt?: Date | null;
    provider?: 'azure' | 'github';
    identifiers?: Record<string, string>;
  } = {},
) {
  const secrets = options.secrets ?? new AesSecretBox(randomBytes(32).toString('base64'));
  const stored: { credentials?: string } = {};
  const connections = {
    createWith: vi
      .fn()
      .mockImplementation(
        async (
          data: { credentials: string; name: string },
          alongside: (row: object) => Promise<void>,
        ) => {
          stored.credentials = data.credentials;
          const row = {
            id: 'c1',
            provider: 'azure',
            createdAt: new Date(),
            identifiers: {},
            removedAt: null,
            createdByName: 'Asha',
            ...data,
          };
          await alongside(row);
          return row;
        },
      ),
    findActive: vi.fn().mockImplementation(() =>
      Promise.resolve({
        id: 'c1',
        name: 'Production',
        provider: options.provider ?? 'azure',
        identifiers: options.identifiers ?? {},
        credentials: stored.credentials ?? '',
      }),
    ),
    updateWith: vi
      .fn()
      .mockImplementation(
        async (
          id: string,
          data: { name: string; credentials?: string },
          alongside: (row: object) => Promise<void>,
        ) => {
          if (data.credentials) stored.credentials = data.credentials;
          const row = { id, provider: 'azure', createdAt: new Date(), identifiers: {}, ...data };
          await alongside(row);
          return row;
        },
      ),
    remove: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
    countsByProvider: vi.fn().mockResolvedValue({ azure: 2, github: 1 }),
    latestRuns: vi.fn().mockResolvedValue([]),
  };
  const runs = {
    createWith: vi
      .fn()
      .mockImplementation(async (data: object, alongside: (row: object) => Promise<void>) => {
        const row = { id: 'r1', ranAt: new Date(), ...data };
        await alongside(row);
        return row;
      }),
    lastRanAt: vi.fn().mockResolvedValue(options.lastRanAt ?? null),
  };
  const azure = {
    verify: vi.fn(options.verify ?? (() => Promise.resolve())),
    connect: vi.fn(() => fakeAzure()),
  };
  const github = {
    verify: vi.fn().mockResolvedValue({ login: 'acme', type: 'Organization' }),
    connect: vi.fn(),
  };
  const activity = { record: vi.fn().mockResolvedValue(undefined) };
  const acceptances = { setOf: vi.fn().mockResolvedValue(new Set<string>()) };
  const snapshots = { record: vi.fn().mockResolvedValue(undefined) };
  const runService = new ConnectionRunService(
    runs as unknown as ConnectionRunRepository,
    connections as unknown as ConnectionRepository,
    activity as unknown as ActivityService,
    acceptances as unknown as CheckAcceptanceService,
    snapshots as unknown as ProofSnapshotService,
  );
  const service = new ConnectionsService(
    connections as unknown as ConnectionRepository,
    secrets,
    new ConnectionDrivers(azure as unknown as AzureConnector, github as unknown as GithubConnector),
    activity as unknown as ActivityService,
    runService,
  );
  const inOrg = <T>(work: () => Promise<T>) => runInOrganization('org-1', work);
  return { service, connections, runs, azure, github, activity, snapshots, stored, secrets, inOrg };
}

describe('ConnectionsService.create', () => {
  it('keeps the credentials sealed, never in the clear, and opens them for the same organisation only', async () => {
    const { service, stored, secrets, inOrg } = build();
    await inOrg(() => service.create(input, actor));
    expect(stored.credentials).toBeTruthy();
    expect(stored.credentials).not.toContain('super-secret-value');
    expect(JSON.parse(secrets.open(stored.credentials!, 'org-1:connection'))).toEqual(credentials);
    expect(() => secrets.open(stored.credentials!, 'org-2:connection')).toThrow();
  });

  it('shows the identifiers and not the secret in what it returns and logs', async () => {
    const { service, activity, inOrg } = build();
    const made = await inOrg(() => service.create(input, actor));
    expect(JSON.stringify(made)).not.toContain('super-secret-value');
    expect(JSON.stringify(activity.record.mock.calls)).not.toContain('super-secret-value');
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CONNECTION_ADDED',
        details: { name: 'Production', provider: 'azure' },
      }),
    );
  });

  it('keeps nothing, and says why, when Microsoft refuses the details', async () => {
    const { service, connections, inOrg } = build({
      verify: () => Promise.reject(new AzureSignInError('no')),
    });
    await expect(inOrg(() => service.create(input, actor))).rejects.toMatchObject({
      code: 'CONNECTION_FAILED',
      params: { reason: 'sign_in' },
    });
    expect(connections.createWith).not.toHaveBeenCalled();
  });

  it('refuses when no secrets key is set, without calling Microsoft', async () => {
    const { service, azure, inOrg } = build({ secrets: new DisabledSecretBox() });
    await expect(inOrg(() => service.create(input, actor))).rejects.toMatchObject({
      code: 'SECRETS_NOT_CONFIGURED',
    });
    expect(azure.verify).not.toHaveBeenCalled();
  });
});

describe('ConnectionsService.run', () => {
  async function created() {
    const harness = build();
    await harness.inOrg(() => harness.service.create(input, actor));
    return harness;
  }

  it('signs in again, runs every check and keeps the run, with who ran it', async () => {
    const { service, runs, azure, activity, inOrg } = await created();
    const run = await inOrg(() => service.run('c1', actor));
    expect(azure.verify).toHaveBeenCalledTimes(2);
    expect(run.results).toHaveLength(51);
    expect(runs.createWith).toHaveBeenCalledWith(
      expect.objectContaining({ connectionId: 'c1', ranByName: 'Asha' }),
      expect.any(Function),
    );
    expect(activity.record).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: 'CONNECTION_CHECKED',
        details: { name: 'Production', passed: 0, total: 51 },
      }),
    );
  });

  it('saves the run and its log entry together, and only after Azure has been read', async () => {
    const { service, runs, activity, azure, inOrg } = await created();
    const order: string[] = [];
    azure.connect.mockImplementation(() => {
      order.push('read');
      return fakeAzure();
    });
    runs.createWith.mockImplementation(
      async (data: object, alongside: (row: object) => Promise<void>) => {
        order.push('saved');
        await alongside({ id: 'r1', ranAt: new Date(), ...data });
        return { id: 'r1', ranAt: new Date(), ...data };
      },
    );
    await inOrg(() => service.run('c1', actor));
    expect(order).toEqual(['read', 'saved']);
    expect(activity.record).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'CONNECTION_CHECKED' }),
    );
  });

  it('refuses a second run within seconds of the last', async () => {
    const { service, runs, inOrg } = await created();
    runs.lastRanAt.mockResolvedValue(new Date());
    await expect(inOrg(() => service.run('c1', actor))).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });
  });

  it('says so when the secret has stopped working, instead of reporting every check as skipped', async () => {
    const { service, azure, runs, inOrg } = await created();
    azure.verify.mockRejectedValueOnce(new AzureSignInError('expired'));
    await expect(inOrg(() => service.run('c1', actor))).rejects.toMatchObject({
      code: 'CONNECTION_FAILED',
      params: { reason: 'sign_in' },
    });
    expect(runs.createWith).not.toHaveBeenCalled();
  });
});

describe('ConnectionsService.list', () => {
  it('says how many connections there are of each kind, across every page, for the catalog', async () => {
    const { service, inOrg } = build();
    const listed = await inOrg(() => service.list(1, 10));
    expect(listed.counts).toEqual({ azure: 2, github: 1 });
  });
});

describe('ConnectionsService.update', () => {
  async function created() {
    const harness = build();
    await harness.inOrg(() => harness.service.create(input, actor));
    return harness;
  }

  it('renames without signing in again, and leaves the sealed details alone', async () => {
    const { service, connections, azure, activity, inOrg } = await created();
    azure.verify.mockClear();
    await inOrg(() => service.update('c1', { name: 'Staging' }, actor));
    expect(azure.verify).not.toHaveBeenCalled();
    expect(connections.updateWith).toHaveBeenCalledWith(
      'c1',
      { name: 'Staging' },
      expect.any(Function),
    );
    expect(activity.record).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: 'CONNECTION_UPDATED',
        details: { name: 'Staging', details: false },
      }),
    );
  });

  it('tries a new secret first, keeps the other details, and seals the result', async () => {
    const { service, azure, stored, secrets, inOrg } = await created();
    await inOrg(() =>
      service.update(
        'c1',
        { name: 'Production', credentials: { clientSecret: 'new-secret' } },
        actor,
      ),
    );
    expect(azure.verify).toHaveBeenLastCalledWith({ ...credentials, clientSecret: 'new-secret' });
    expect(JSON.parse(secrets.open(stored.credentials!, 'org-1:connection'))).toEqual({
      ...credentials,
      clientSecret: 'new-secret',
    });
  });

  it('keeps the old details, and says why, when Microsoft refuses the new ones', async () => {
    const { service, connections, azure, inOrg } = await created();
    azure.verify.mockRejectedValueOnce(new AzureSignInError('no'));
    await expect(
      inOrg(() =>
        service.update('c1', { name: 'Production', credentials: { clientSecret: 'bad' } }, actor),
      ),
    ).rejects.toMatchObject({ code: 'CONNECTION_FAILED', params: { reason: 'sign_in' } });
    expect(connections.updateWith).not.toHaveBeenCalled();
  });

  it('never logs or returns the secret', async () => {
    const { service, activity, inOrg } = await created();
    const made = await inOrg(() =>
      service.update(
        'c1',
        { name: 'Production', credentials: { clientSecret: 'new-secret' } },
        actor,
      ),
    );
    expect(JSON.stringify(made)).not.toContain('new-secret');
    expect(JSON.stringify(activity.record.mock.calls)).not.toContain('new-secret');
  });
});

describe('ConnectionsService.remove', () => {
  it('forgets the connection and logs it', async () => {
    const { service, connections, activity, inOrg } = build();
    await inOrg(() => service.remove('c1', actor));
    expect(connections.remove).toHaveBeenCalledWith('c1', expect.any(Date));
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CONNECTION_REMOVED', details: { name: 'Production' } }),
    );
  });
});

describe('ConnectionsService with GitHub', () => {
  const githubInput = {
    provider: 'github' as const,
    name: 'Techdome',
    credentials: {
      appId: '123',
      installationId: '456',
      privateKey: '-----BEGIN RSA PRIVATE KEY-----\nkey\n-----END RSA PRIVATE KEY-----',
    },
    repositories: { mode: 'selected' as const, repositories: ['acme/api', 'acme/web'] },
  };
  const kept = {
    appId: '123',
    installationId: '456',
    account: 'acme',
    accountType: 'Organization',
    mode: 'selected',
    repositories: 'acme/api',
  };

  it('tries the App with GitHub, and keeps the account and the chosen repositories in the clear', async () => {
    const { service, github, connections, inOrg } = build({ provider: 'github' });
    await inOrg(() => service.create(githubInput, actor));
    expect(github.verify).toHaveBeenCalledWith(githubInput.credentials);
    expect(connections.createWith).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'github',
        identifiers: {
          appId: '123',
          installationId: '456',
          account: 'acme',
          accountType: 'Organization',
          mode: 'selected',
          repositories: 'acme/api,acme/web',
        },
      }),
      expect.any(Function),
    );
  });

  it('never keeps or logs the private key in the clear', async () => {
    const { service, stored, activity, inOrg } = build({ provider: 'github' });
    const made = await inOrg(() => service.create(githubInput, actor));
    expect(stored.credentials).not.toContain('BEGIN RSA');
    expect(JSON.stringify(made)).not.toContain('BEGIN RSA');
    expect(JSON.stringify(activity.record.mock.calls)).not.toContain('BEGIN RSA');
  });

  it('says it is GitHub that refused, when it does', async () => {
    const { service, github, connections, inOrg } = build({ provider: 'github' });
    github.verify.mockRejectedValueOnce(new GithubSignInError('no'));
    await expect(inOrg(() => service.create(githubInput, actor))).rejects.toMatchObject({
      code: 'CONNECTION_FAILED',
      params: { reason: 'sign_in', provider: 'github' },
    });
    expect(connections.createWith).not.toHaveBeenCalled();
  });

  it('changes the repositories without a new key, and leaves the sealed details alone', async () => {
    const { service, github, connections, inOrg } = build({
      provider: 'github',
      identifiers: kept,
    });
    await inOrg(() => service.create(githubInput, actor));
    github.verify.mockClear();
    await inOrg(() =>
      service.update(
        'c1',
        { name: 'Techdome', repositories: { mode: 'all', repositories: [] } },
        actor,
      ),
    );
    expect(github.verify).toHaveBeenCalledTimes(1);
    const [, changes] = connections.updateWith.mock.lastCall as [string, Record<string, unknown>];
    expect(changes).toMatchObject({ identifiers: { mode: 'all', repositories: '' } });
    expect(changes).not.toHaveProperty('credentials');
  });

  it('refuses a tenant on a GitHub connection, without asking GitHub', async () => {
    const { service, github, inOrg } = build({ provider: 'github', identifiers: kept });
    await inOrg(() => service.create(githubInput, actor));
    github.verify.mockClear();
    await expect(
      inOrg(() =>
        service.update('c1', { name: 'X', credentials: { tenantId: 'a'.repeat(36) } }, actor),
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(github.verify).not.toHaveBeenCalled();
  });

  it('refuses repositories on an Azure connection', async () => {
    const { service, inOrg } = build();
    await inOrg(() => service.create(input, actor));
    await expect(
      inOrg(() =>
        service.update('c1', { name: 'X', repositories: { mode: 'all', repositories: [] } }, actor),
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});
