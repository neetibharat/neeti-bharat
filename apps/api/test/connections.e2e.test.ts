import { GITHUB_CHECK_IDS } from '@dpdp-kit/shared';
import type {
  ConnectionListResponse,
  ConnectionRunResponse,
  ConnectionSummary,
  CreatedApiKeyResponse,
  OrganizationSummary,
} from '@dpdp-kit/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { REFUSED_SECRET, azureConnector } from './support/fake-azure-connector';
import { GOOD_KEY, REFUSED_KEY } from './support/fake-github-connector';
import { startTestApp, type Client, type TestApp } from './support/test-app';

const SECRET = 'a-client-secret-that-must-never-come-back';

const credentials = (clientSecret = SECRET) => ({
  tenantId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  clientId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  subscriptionId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  clientSecret,
});

const world = {} as {
  app: TestApp;
  alice: Client;
  bob: Client;
  alpha: string;
  beta: string;
  connectionId: string;
};

async function makeKey(role: 'admin' | 'member') {
  const made = await world.alice.post<CreatedApiKeyResponse>(
    '/v1/api-keys',
    { name: `${role} key`, role },
    world.alpha,
  );
  return world.app.withKey(made.body.key);
}

beforeAll(async () => {
  world.app = await startTestApp();
  world.alice = await world.app.signIn('alice@alpha.test');
  world.alpha = (
    await world.alice.post<OrganizationSummary>('/v1/organizations', { name: 'Alpha Pvt Ltd' })
  ).body.id;
  await world.alice.post(
    '/v1/people',
    { name: 'Bob', email: 'bob@beta.test', access: 'member' },
    world.alpha,
  );
  world.bob = await world.app.signIn('bob@beta.test');
  world.beta = (
    await world.bob.post<OrganizationSummary>('/v1/organizations', { name: 'Beta Industries' })
  ).body.id;
});

afterAll(async () => {
  await world.app?.stop();
});

describe('finding subscriptions', () => {
  const app = (clientSecret = SECRET) => ({
    tenantId: credentials().tenantId,
    clientId: credentials().clientId,
    clientSecret,
  });

  it('lists what the app can see, and never sends the secret back', async () => {
    const found = await world.alice.post<{ items: { id: string; name: string }[] }>(
      '/v1/connections/subscriptions',
      app(),
      world.alpha,
    );
    expect(found.status).toBe(200);
    expect(found.body.items.map((item) => item.name)).toEqual(['Archive', 'Production']);
    expect(found.text).not.toContain(SECRET);
  });

  it('says why when Microsoft refuses the sign-in', async () => {
    const refused = await world.alice.post<{ code: string; params?: { reason: string } }>(
      '/v1/connections/subscriptions',
      app(REFUSED_SECRET),
      world.alpha,
    );
    expect([refused.status, refused.body.code, refused.body.params?.reason]).toEqual([
      400,
      'CONNECTION_FAILED',
      'sign_in',
    ]);
  });

  it('is for admins who are people: not a member, and not an admin key', async () => {
    expect((await world.bob.post('/v1/connections/subscriptions', app(), world.alpha)).status).toBe(
      403,
    );
    const adminKey = await makeKey('admin');
    expect((await adminKey.post('/v1/connections/subscriptions', app())).status).toBe(403);
  });
});

describe('adding a connection', () => {
  it('tries the details first, and keeps nothing when Microsoft refuses them', async () => {
    const refused = await world.alice.post<{ code: string; params?: { reason: string } }>(
      '/v1/connections',
      { provider: 'azure', name: 'Refused', credentials: credentials(REFUSED_SECRET) },
      world.alpha,
    );
    expect([refused.status, refused.body.code, refused.body.params?.reason]).toEqual([
      400,
      'CONNECTION_FAILED',
      'sign_in',
    ]);
    const listed = await world.alice.get<ConnectionListResponse>('/v1/connections', world.alpha);
    expect(listed.body.items).toEqual([]);
  });

  it('refuses details that are not what Azure issues, before any call', async () => {
    const bad = await world.alice.post(
      '/v1/connections',
      {
        provider: 'azure',
        name: 'Bad',
        credentials: { ...credentials(), tenantId: '../../evil' },
      },
      world.alpha,
    );
    expect(bad.status).toBe(400);
  });

  it('keeps the details and never sends the secret back', async () => {
    const made = await world.alice.post<ConnectionSummary>(
      '/v1/connections',
      { provider: 'azure', name: 'Production', credentials: credentials() },
      world.alpha,
    );
    expect(made.status).toBe(201);
    expect(made.text).not.toContain(SECRET);
    expect(made.body.identifiers).toEqual({
      tenantId: credentials().tenantId,
      clientId: credentials().clientId,
      subscriptionId: credentials().subscriptionId,
    });
    world.connectionId = made.body.id;
    const listed = await world.alice.get<ConnectionListResponse>('/v1/connections', world.alpha);
    expect(listed.text).not.toContain(SECRET);
    expect(listed.body).toMatchObject({ enabled: true, total: 1 });
  });

  it('is for admins, and only for people: not a member, and not even an admin key', async () => {
    const body = { provider: 'azure', name: 'Another', credentials: credentials() };
    expect((await world.bob.post('/v1/connections', body, world.alpha)).status).toBe(403);
    const adminKey = await makeKey('admin');
    expect((await adminKey.post('/v1/connections', body)).status).toBe(403);
    expect((await adminKey.delete(`/v1/connections/${world.connectionId}`)).status).toBe(403);
  });
});

describe('opening one connection', () => {
  it('gives its details and latest run, never the secret, to anyone who can read', async () => {
    const one = await world.alice.get<ConnectionSummary>(
      `/v1/connections/${world.connectionId}`,
      world.alpha,
    );
    expect(one.status).toBe(200);
    expect(one.body).toMatchObject({ id: world.connectionId, name: 'Production', lastRun: null });
    expect(one.text).not.toContain(SECRET);
  });
});

describe('checking a connection', () => {
  it('reads the system and keeps the results, one for each check', async () => {
    const run = await world.alice.post<ConnectionRunResponse>(
      `/v1/connections/${world.connectionId}/run`,
      undefined,
      world.alpha,
    );
    expect(run.status).toBe(201);
    expect(run.body.results).toHaveLength(51);
    expect(run.body.passed + run.body.warned + run.body.failed + run.body.skipped).toBe(51);
    expect(run.body.results.find((result) => result.id === 'entra_mfa_enforced')?.status).toBe(
      'pass',
    );
    const one = await world.alice.get<ConnectionRunResponse>(
      `/v1/connections/runs/${run.body.id}`,
      world.alpha,
    );
    expect(one.body.results).toHaveLength(51);
    const listed = await world.alice.get<ConnectionListResponse>('/v1/connections', world.alpha);
    expect(listed.body.items[0]!.lastRun?.id).toBe(run.body.id);
  });

  it('is not repeated within seconds', async () => {
    const again = await world.alice.post<{ code: string }>(
      `/v1/connections/${world.connectionId}/run`,
      undefined,
      world.alpha,
    );
    expect([again.status, again.body.code]).toEqual([429, 'RATE_LIMITED']);
  });

  it('is open to a member and to a member key, and read-only for an auditor’s view of results', async () => {
    const memberKey = await makeKey('member');
    // The first run was moments ago, so a second one is refused for time, not for permission.
    const asKey = await memberKey.post(`/v1/connections/${world.connectionId}/run`);
    expect(asKey.status).toBe(429);
    expect((await memberKey.get('/v1/connections')).status).toBe(200);
  });

  it('keeps the secret out of the activity log', async () => {
    const log = await world.alice.get('/v1/activity?limit=100', world.alpha);
    expect(log.text).toContain('CONNECTION_ADDED');
    expect(log.text).toContain('CONNECTION_CHECKED');
    expect(log.text).not.toContain(SECRET);
  });
});

describe('changing a connection', () => {
  const path = () => `/v1/connections/${world.connectionId}`;

  it('renames it without asking Microsoft, and the activity log says so', async () => {
    const seen = azureConnector.verified.length;
    const changed = await world.alice.put<ConnectionSummary>(
      path(),
      { name: 'Production subscription' },
      world.alpha,
    );
    expect(changed.status).toBe(200);
    expect(changed.body.name).toBe('Production subscription');
    expect(azureConnector.verified).toHaveLength(seen);
    const log = await world.alice.get('/v1/activity?limit=100', world.alpha);
    expect(log.text).toContain('CONNECTION_UPDATED');
  });

  it('keeps the old secret, and says why, when Microsoft refuses a new one', async () => {
    const refused = await world.alice.put<{ code: string; params?: { reason: string } }>(
      path(),
      { name: 'Production subscription', credentials: { clientSecret: REFUSED_SECRET } },
      world.alpha,
    );
    expect([refused.status, refused.body.code, refused.body.params?.reason]).toEqual([
      400,
      'CONNECTION_FAILED',
      'sign_in',
    ]);
    const one = await world.alice.get<ConnectionSummary>(path(), world.alpha);
    expect(one.body.name).toBe('Production subscription');
  });

  it('replaces the secret once Microsoft accepts it, and never sends it back', async () => {
    const changed = await world.alice.put<ConnectionSummary>(
      path(),
      { name: 'Production subscription', credentials: { clientSecret: 'a-newer-secret' } },
      world.alpha,
    );
    expect(changed.status).toBe(200);
    expect(changed.text).not.toContain('a-newer-secret');
    expect(azureConnector.verified.at(-1)).toMatchObject({
      clientSecret: 'a-newer-secret',
      subscriptionId: credentials().subscriptionId,
    });
  });

  it('cannot move to another subscription', async () => {
    const moved = await world.alice.put(
      path(),
      {
        name: 'Production',
        credentials: { subscriptionId: 'dddddddd-dddd-dddd-dddd-dddddddddddd' },
      },
      world.alpha,
    );
    expect(moved.status).toBe(400);
  });

  it('is for admins who are people: not a member, an admin key, or another organisation', async () => {
    const body = { name: 'Taken over' };
    expect((await world.bob.put(path(), body, world.alpha)).status).toBe(403);
    const adminKey = await makeKey('admin');
    expect((await adminKey.put(path(), body)).status).toBe(403);
    expect((await world.bob.put(path(), body, world.beta)).status).toBe(404);
  });
});

describe('a GitHub connection', () => {
  const credentials = { appId: '123', installationId: '4242', privateKey: GOOD_KEY };
  const body = (over: object = {}) => ({
    provider: 'github',
    name: 'Techdome GitHub',
    credentials,
    repositories: { mode: 'all', repositories: [] },
    ...over,
  });
  let id = '';

  it('finds the organisation the App is installed on and its repositories, and never sends the key back', async () => {
    const found = await world.alice.post<{
      items: { id: string; account: string; repositories: { name: string }[] }[];
    }>('/v1/connections/github/discover', { appId: '123', privateKey: GOOD_KEY }, world.alpha);
    expect(found.status).toBe(200);
    expect(found.body.items[0]).toMatchObject({ id: '4242', account: 'acme' });
    expect(found.body.items[0]!.repositories.map((repo) => repo.name)).toEqual([
      'acme/api',
      'acme/web',
    ]);
    expect(found.text).not.toContain('BEGIN RSA');
  });

  it('says why when GitHub refuses the App, before anything is kept', async () => {
    const refused = await world.alice.post<{
      code: string;
      params?: { reason: string; provider: string };
    }>(
      '/v1/connections',
      body({ credentials: { ...credentials, privateKey: REFUSED_KEY } }),
      world.alpha,
    );
    expect([refused.status, refused.body.code, refused.body.params]).toEqual([
      400,
      'CONNECTION_FAILED',
      { reason: 'sign_in', provider: 'github' },
    ]);
  });

  it('refuses a key that is not a private key, before any call', async () => {
    const bad = await world.alice.post(
      '/v1/connections',
      body({ credentials: { ...credentials, privateKey: 'hello' } }),
      world.alpha,
    );
    expect(bad.status).toBe(400);
  });

  it('keeps the App and the account, and never sends the key back', async () => {
    const made = await world.alice.post<ConnectionSummary>('/v1/connections', body(), world.alpha);
    expect(made.status).toBe(201);
    expect(made.text).not.toContain('BEGIN RSA');
    expect(made.body.identifiers).toMatchObject({
      appId: '123',
      installationId: '4242',
      account: 'acme',
      mode: 'all',
    });
    id = made.body.id;
    const listed = await world.alice.get<ConnectionListResponse>('/v1/connections', world.alpha);
    expect(listed.body.counts).toMatchObject({ github: 1 });
  });

  it('checks the repositories and keeps the results, one for each check', async () => {
    const run = await world.alice.post<ConnectionRunResponse>(
      `/v1/connections/${id}/run`,
      undefined,
      world.alpha,
    );
    expect(run.status).toBe(201);
    expect(run.body.results.map((result) => result.id)).toEqual(GITHUB_CHECK_IDS);
    expect(run.body.failed).toBe(0);
    expect(run.text).not.toContain('BEGIN RSA');
  });

  it('lists the repositories it can see, and reads only the ones picked', async () => {
    const seen = await world.alice.get<{ items: { name: string }[] }>(
      `/v1/connections/${id}/repositories`,
      world.alpha,
    );
    expect(seen.body.items.map((repo) => repo.name)).toEqual(['acme/api', 'acme/web']);
    const changed = await world.alice.put<ConnectionSummary>(
      `/v1/connections/${id}`,
      { name: 'Techdome GitHub', repositories: { mode: 'selected', repositories: ['acme/api'] } },
      world.alpha,
    );
    expect(changed.status).toBe(200);
    expect(changed.body.identifiers).toMatchObject({ mode: 'selected', repositories: 'acme/api' });
  });

  it('cannot be given an Azure tenant, and is for admins who are people', async () => {
    const foreign = await world.alice.put(
      `/v1/connections/${id}`,
      { name: 'X', credentials: { tenantId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } },
      world.alpha,
    );
    expect(foreign.status).toBe(400);
    expect((await world.bob.get(`/v1/connections/${id}/repositories`, world.alpha)).status).toBe(
      403,
    );
    const adminKey = await makeKey('admin');
    expect((await adminKey.get(`/v1/connections/${id}/repositories`)).status).toBe(403);
    expect(
      (await adminKey.post('/v1/connections/github/discover', { appId: '1', privateKey: GOOD_KEY }))
        .status,
    ).toBe(403);
  });

  it('is gone from the list once removed', async () => {
    expect((await world.alice.delete(`/v1/connections/${id}`, world.alpha)).status).toBe(204);
  });
});

describe('between organisations', () => {
  it('shows another organisation nothing of the connection, and lets it do nothing with it', async () => {
    const listed = await world.bob.get<ConnectionListResponse>('/v1/connections', world.beta);
    expect(listed.body.items).toEqual([]);
    const path = `/v1/connections/${world.connectionId}`;
    expect((await world.bob.post(`${path}/run`, undefined, world.beta)).status).toBe(404);
    expect((await world.bob.get(`${path}/runs`, world.beta)).status).toBe(404);
    expect((await world.bob.get(path, world.beta)).status).toBe(404);
    expect((await world.bob.delete(path, world.beta)).status).toBe(404);
  });
});

describe('a run that takes longer than a database transaction may', () => {
  it('is still saved, because nothing is held open while Azure is read', async () => {
    const made = await world.alice.post<ConnectionSummary>(
      '/v1/connections',
      { provider: 'azure', name: 'Slow tenant', credentials: credentials() },
      world.alpha,
    );
    expect(made.status).toBe(201);
    // Longer than the 15 seconds a request's own transaction is allowed.
    azureConnector.delayMs = 16_000;
    try {
      const run = await world.alice.post<ConnectionRunResponse>(
        `/v1/connections/${made.body.id}/run`,
        undefined,
        world.alpha,
      );
      expect(run.status).toBe(201);
      expect(run.body.results).toHaveLength(51);
    } finally {
      azureConnector.delayMs = 0;
    }
    const listed = await world.alice.get<ConnectionListResponse>(
      '/v1/connections?limit=100',
      world.alpha,
    );
    const slow = listed.body.items.find((item) => item.id === made.body.id);
    expect(slow?.lastRun).not.toBeNull();
    // Leaves nothing behind for the tests that follow.
    expect((await world.alice.delete(`/v1/connections/${made.body.id}`, world.alpha)).status).toBe(
      204,
    );
  }, 60_000);
});

describe('removing a connection', () => {
  it('forgets it: it is gone from the list and cannot be run, and the removal is logged', async () => {
    const removed = await world.alice.delete(`/v1/connections/${world.connectionId}`, world.alpha);
    expect(removed.status).toBe(204);
    const listed = await world.alice.get<ConnectionListResponse>('/v1/connections', world.alpha);
    expect(listed.body.items).toEqual([]);
    const run = await world.alice.post(
      `/v1/connections/${world.connectionId}/run`,
      undefined,
      world.alpha,
    );
    expect(run.status).toBe(404);
    const log = await world.alice.get('/v1/activity?limit=100', world.alpha);
    expect(log.text).toContain('CONNECTION_REMOVED');
  });
});
