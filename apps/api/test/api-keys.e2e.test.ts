import type {
  ApiKeyListResponse,
  CreatedApiKeyResponse,
  OrganizationSummary,
} from '@neeti-bharat/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp, type Client, type TestApp } from './support/test-app';

interface Titles {
  items: { title: string }[];
}

const world = {} as { app: TestApp; alice: Client; bob: Client; alpha: string; beta: string };

const breach = (title: string) => ({
  title,
  description: 'What happened',
  affectedSystems: 'A system',
  affectedData: 'Some data',
});

async function makeKey(role: 'admin' | 'member' | 'auditor', name = 'Claude Code') {
  const made = await world.alice.post<CreatedApiKeyResponse>(
    '/v1/api-keys',
    { name, role },
    world.alpha,
  );
  expect(made.status).toBe(201);
  return made.body;
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
  await world.bob.post('/v1/breaches', breach('Beta breach'), world.beta);
});

afterAll(async () => {
  await world.app?.stop();
});

describe('making and listing keys', () => {
  it('shows the whole key once, and the list never again', async () => {
    const made = await makeKey('member', 'Listed key');
    expect(made.key).toMatch(/^sk_live_[0-9a-f]{64}$/);
    const listed = await world.alice.get<ApiKeyListResponse>('/v1/api-keys', world.alpha);
    expect(listed.text).not.toContain(made.key);
    expect(listed.body.items.find((item) => item.id === made.id)).toMatchObject({
      name: 'Listed key',
      role: 'member',
      prefix: made.prefix,
      createdByName: 'alice@alpha.test',
      lastUsedAt: null,
      revokedAt: null,
    });
  });

  it('is for admins: a member cannot make, list or revoke keys', async () => {
    const asMember = (call: Promise<{ status: number }>) => call.then((reply) => reply.status);
    expect(
      await asMember(world.bob.post('/v1/api-keys', { name: 'x', role: 'member' }, world.alpha)),
    ).toBe(403);
    expect(await asMember(world.bob.get('/v1/api-keys', world.alpha))).toBe(403);
  });

  it('makes a key with any role, and refuses one that is not a role', async () => {
    expect((await makeKey('admin', 'Admin key')).role).toBe('admin');
    const bad = await world.alice.post(
      '/v1/api-keys',
      { name: 'Nope', role: 'owner' },
      world.alpha,
    );
    expect(bad.status).toBe(400);
  });

  it('keeps each organisation’s keys apart', async () => {
    const made = await makeKey('member', 'Alpha only');
    const beta = await world.bob.get<ApiKeyListResponse>('/v1/api-keys', world.beta);
    expect(beta.body.items.map((item) => item.id)).not.toContain(made.id);
    expect((await world.bob.delete(`/v1/api-keys/${made.id}`, world.beta)).status).toBe(404);
  });
});

describe('calling with a key', () => {
  it('works with the key alone, in the key’s own organisation', async () => {
    const { key } = await makeKey('member');
    const agent = world.app.withKey(key);
    const made = await agent.post('/v1/breaches', breach('Reported by an agent'));
    expect(made.status).toBe(201);
    const listed = await agent.get<Titles>('/v1/breaches?tab=open');
    expect(listed.body.items.map((item) => item.title)).toEqual(['Reported by an agent']);
  });

  it('cannot reach another organisation, even when it names one', async () => {
    const { key } = await makeKey('member');
    const agent = world.app.withKey(key);
    const listed = await agent.get<Titles>('/v1/breaches?tab=open', world.beta);
    expect(listed.body.items.map((item) => item.title)).not.toContain('Beta breach');
  });

  it('names the key creator in the activity log', async () => {
    const log = await world.alice.get<{ items: { action: string; actorLabel?: string }[] }>(
      '/v1/activity?limit=100',
      world.alpha,
    );
    expect(log.text).toContain('Reported by an agent');
    expect(log.text).toContain('alice@alpha.test');
  });

  it('is held to the key role: an auditor key reads and cannot change', async () => {
    const { key } = await makeKey('auditor');
    const agent = world.app.withKey(key);
    expect((await agent.get('/v1/breaches?tab=open')).status).toBe(200);
    expect((await agent.post('/v1/breaches', breach('Nope'))).status).toBe(403);
  });

  it('with an admin key can do what an admin can, except make or see keys', async () => {
    const { key } = await makeKey('admin');
    const agent = world.app.withKey(key);
    const added = await agent.post('/v1/people', {
      name: 'Dana',
      email: 'dana@alpha.test',
      access: 'member',
    });
    expect(added.status).toBe(201);
    expect((await agent.post('/v1/api-keys', { name: 'Child', role: 'admin' })).status).toBe(403);
    expect((await agent.get('/v1/api-keys')).status).toBe(403);
    const mine = await world.alice.get<ApiKeyListResponse>('/v1/api-keys?limit=100', world.alpha);
    expect(mine.body.items.map((item) => item.name)).not.toContain('Child');
  });

  it('cannot make keys, add people or start an organisation', async () => {
    const { key } = await makeKey('member');
    const agent = world.app.withKey(key);
    expect((await agent.post('/v1/api-keys', { name: 'Child', role: 'member' })).status).toBe(403);
    expect(
      (await agent.post('/v1/people', { name: 'Eve', email: 'eve@alpha.test', access: 'member' }))
        .status,
    ).toBe(403);
    expect((await agent.post('/v1/organizations', { name: 'Mine now' })).status).toBe(403);
    expect((await agent.get('/v1/me')).status).toBe(403);
  });

  it('is turned away when the key is wrong', async () => {
    expect((await world.app.withKey('sk_live_nope').get('/v1/breaches')).status).toBe(401);
    expect((await world.app.withKey('').get('/v1/breaches')).status).toBe(401);
  });

  it('notes when the key was last used', async () => {
    const made = await makeKey('member', 'Used key');
    await world.app.withKey(made.key).get('/v1/breaches?tab=open');
    const listed = await world.alice.get<ApiKeyListResponse>('/v1/api-keys?limit=100', world.alpha);
    expect(listed.body.items.find((item) => item.id === made.id)?.lastUsedAt).not.toBeNull();
  });

  it('answers every read route without a server error', async () => {
    const { key } = await makeKey('member');
    const agent = world.app.withKey(key);
    const failures: string[] = [];
    for (const route of world.app.readRoutes()) {
      const reply = await agent.get(route);
      if (reply.status >= 500) failures.push(`${route} -> ${reply.status}`);
    }
    expect(failures).toEqual([]);
  });
});

describe('ending a key', () => {
  it('stops working the moment it is revoked, and the log says so', async () => {
    const made = await makeKey('member', 'Short lived');
    const agent = world.app.withKey(made.key);
    expect((await agent.get('/v1/breaches?tab=open')).status).toBe(200);
    expect((await world.alice.delete(`/v1/api-keys/${made.id}`, world.alpha)).status).toBe(204);
    expect((await agent.get('/v1/breaches?tab=open')).status).toBe(401);
    const listed = await world.alice.get<ApiKeyListResponse>('/v1/api-keys?limit=100', world.alpha);
    expect(listed.body.items.find((item) => item.id === made.id)?.revokedAt).not.toBeNull();
    const log = await world.alice.get('/v1/activity?limit=100', world.alpha);
    expect(log.text).toContain('API_KEY_REVOKED');
    expect(log.text).not.toContain(made.key);
  });
});
