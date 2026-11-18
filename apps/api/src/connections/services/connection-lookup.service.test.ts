import { randomBytes } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { runInOrganization } from '../../core/org/org-context';
import { AesSecretBox } from '../../core/secrets/secret-box';
import { AzureSignInError, type AzureConnector } from '../providers/azure/azure-api';
import { GithubSignInError, type GithubConnector } from '../providers/github/github-api';
import type { ConnectionRepository } from '../repositories/connection.repository';
import { ConnectionLookupService } from './connection-lookup.service';

function build(row: { provider: string; credentials: string } | null = null) {
  const azure = {
    subscriptions: vi
      .fn()
      .mockResolvedValue([
        { subscriptionId: 'sub-b', displayName: 'Staging', state: 'Enabled' },
        { subscriptionId: 'sub-a', displayName: 'Production', state: 'Enabled' },
        { subscriptionId: 'sub-c' },
      ]),
  };
  const github = {
    discover: vi.fn().mockResolvedValue([
      {
        id: '4242',
        account: { login: 'acme', type: 'Organization' },
        repositories: [{ name: 'acme/api', isPrivate: true }],
      },
    ]),
    repositories: vi.fn().mockResolvedValue([{ name: 'acme/api', isPrivate: true }]),
  };
  const connections = { findActive: vi.fn().mockResolvedValue(row) };
  const secrets = new AesSecretBox(randomBytes(32).toString('base64'));
  const service = new ConnectionLookupService(
    connections as unknown as ConnectionRepository,
    secrets,
    azure as unknown as AzureConnector,
    github as unknown as GithubConnector,
  );
  const inOrg = <T>(work: () => Promise<T>) => runInOrganization('org-1', work);
  return { service, azure, github, connections, secrets, inOrg };
}

const app = { tenantId: 'a', clientId: 'b', clientSecret: 'c' };

describe('ConnectionLookupService.findSubscriptions', () => {
  it('lists what the app can see by name, and falls back to the id when a name is missing', async () => {
    const { service } = build();
    const found = await service.findSubscriptions(app);
    expect(found.items).toEqual([
      { id: 'sub-a', name: 'Production' },
      { id: 'sub-b', name: 'Staging' },
      { id: 'sub-c', name: 'sub-c' },
    ]);
  });

  it('says why when Microsoft refuses the sign-in', async () => {
    const { service, azure } = build();
    azure.subscriptions.mockRejectedValueOnce(new AzureSignInError('no'));
    await expect(service.findSubscriptions(app)).rejects.toMatchObject({
      code: 'CONNECTION_FAILED',
      params: { reason: 'sign_in', provider: 'azure' },
    });
  });
});

describe('ConnectionLookupService GitHub', () => {
  it('lists the organisations the App is installed on, with their repositories', async () => {
    const { service } = build();
    const found = await service.discoverGithub({ appId: '1', privateKey: 'k' });
    expect(found.items).toEqual([
      { id: '4242', account: 'acme', repositories: [{ name: 'acme/api', isPrivate: true }] },
    ]);
  });

  it('says why when GitHub refuses the App', async () => {
    const { service, github } = build();
    github.discover.mockRejectedValueOnce(new GithubSignInError('no'));
    await expect(service.discoverGithub({ appId: '1', privateKey: 'k' })).rejects.toMatchObject({
      code: 'CONNECTION_FAILED',
      params: { reason: 'sign_in', provider: 'github' },
    });
  });

  it('lists the repositories of a connection from its own sealed key', async () => {
    const harness = build();
    const sealed = harness.secrets.seal(
      JSON.stringify({ appId: '1', installationId: '2', privateKey: 'k' }),
      'org-1:connection',
    );
    harness.connections.findActive.mockResolvedValue({ provider: 'github', credentials: sealed });
    const found = await harness.inOrg(() => harness.service.githubRepositories('c1'));
    expect(found.items).toEqual([{ name: 'acme/api', isPrivate: true }]);
    expect(harness.github.repositories).toHaveBeenCalledWith({
      appId: '1',
      installationId: '2',
      privateKey: 'k',
    });
  });

  it('knows nothing of a connection that is not GitHub, or is gone', async () => {
    const harness = build({ provider: 'azure', credentials: '' });
    await expect(harness.service.githubRepositories('c1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    harness.connections.findActive.mockResolvedValue(null);
    await expect(harness.service.githubRepositories('c1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
