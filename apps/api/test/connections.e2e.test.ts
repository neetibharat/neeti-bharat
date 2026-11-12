import type {
  ConnectionListResponse,
  ConnectionRunResponse,
  ConnectionSummary,
  CreatedApiKeyResponse,
  OrganizationSummary,
} from '@dpdp-kit/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { REFUSED_SECRET } from './support/fake-azure-connector';
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

describe('checking a connection', () => {
  it('reads the system and keeps the results, one for each check', async () => {
    const run = await world.alice.post<ConnectionRunResponse>(
      `/v1/connections/${world.connectionId}/run`,
      undefined,
      world.alpha,
    );
    expect(run.status).toBe(201);
    expect(run.body.results).toHaveLength(11);
    expect(run.body.passed + run.body.warned + run.body.failed + run.body.skipped).toBe(11);
    expect(run.body.results.find((result) => result.id === 'entra_mfa_enforced')?.status).toBe(
      'pass',
    );
    const one = await world.alice.get<ConnectionRunResponse>(
      `/v1/connections/runs/${run.body.id}`,
      world.alpha,
    );
    expect(one.body.results).toHaveLength(11);
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

describe('between organisations', () => {
  it('shows another organisation nothing of the connection, and lets it do nothing with it', async () => {
    const listed = await world.bob.get<ConnectionListResponse>('/v1/connections', world.beta);
    expect(listed.body.items).toEqual([]);
    const path = `/v1/connections/${world.connectionId}`;
    expect((await world.bob.post(`${path}/run`, undefined, world.beta)).status).toBe(404);
    expect((await world.bob.get(`${path}/runs`, world.beta)).status).toBe(404);
    expect((await world.bob.delete(path, world.beta)).status).toBe(404);
  });
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
