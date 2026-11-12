import { randomBytes } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import { runInOrganization } from '../../core/org/org-context';
import { AesSecretBox, DisabledSecretBox, type SecretBox } from '../../core/secrets/secret-box';
import { AzureSignInError, type AzureConnector } from '../providers/azure/azure-api';
import { fakeAzure } from '../providers/azure/checks/fake-azure';
import type { ConnectionRunRepository } from '../repositories/connection-run.repository';
import type { ConnectionRepository } from '../repositories/connection.repository';
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
  options: { secrets?: SecretBox; verify?: () => Promise<void>; lastRanAt?: Date | null } = {},
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
        provider: 'azure',
        credentials: stored.credentials ?? '',
      }),
    ),
    remove: vi.fn().mockResolvedValue(undefined),
    list: vi.fn(),
    latestRuns: vi.fn(),
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
  const activity = { record: vi.fn().mockResolvedValue(undefined) };
  const service = new ConnectionsService(
    connections as unknown as ConnectionRepository,
    runs as unknown as ConnectionRunRepository,
    secrets,
    azure as unknown as AzureConnector,
    activity as unknown as ActivityService,
  );
  const inOrg = <T>(work: () => Promise<T>) => runInOrganization('org-1', work);
  return { service, connections, runs, azure, activity, stored, secrets, inOrg };
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
