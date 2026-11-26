import type { CreatedApiKeyResponse, OrganizationSummary } from '@neeti-bharat/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp, type Client, type TestApp } from './support/test-app';

const world = {} as { app: TestApp; alice: Client; bob: Client; alpha: string; beta: string };

const names = async (person: Client) =>
  (await person.get<{ organizations: OrganizationSummary[] }>('/v1/me')).body.organizations.map(
    (org) => org.name,
  );

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

describe('closing an organisation', () => {
  it('needs an admin, the organisation’s own name, and a person rather than a key', async () => {
    const asMember = await world.bob.post(
      '/v1/organizations/current/close',
      { name: 'Alpha Pvt Ltd' },
      world.alpha,
    );
    expect(asMember.status).toBe(403);

    const wrongName = await world.alice.post<{ code: string }>(
      '/v1/organizations/current/close',
      { name: 'alpha pvt ltd' },
      world.alpha,
    );
    expect([wrongName.status, wrongName.body.code]).toEqual([428, 'CONFIRMATION_REQUIRED']);

    const key = (
      await world.alice.post<CreatedApiKeyResponse>(
        '/v1/api-keys',
        { name: 'Admin key', role: 'admin' },
        world.alpha,
      )
    ).body.key;
    const withKey = await world.app
      .withKey(key)
      .post('/v1/organizations/current/close', { name: 'Alpha Pvt Ltd' });
    expect(withKey.status).toBe(403);
    expect(await names(world.alice)).toEqual(['Alpha Pvt Ltd']);
  });

  it('hides the organisation from everyone and ends its keys, and leaves others alone', async () => {
    const key = (
      await world.alice.post<CreatedApiKeyResponse>(
        '/v1/api-keys',
        { name: 'Member key', role: 'member' },
        world.alpha,
      )
    ).body.key;
    expect((await world.app.withKey(key).get('/v1/breaches?tab=open')).status).toBe(200);
    await world.alice.post(
      '/v1/breaches',
      {
        title: 'Before closing',
        description: 'What happened',
        affectedSystems: 'A system',
        affectedData: 'Some data',
      },
      world.alpha,
    );

    const closed = await world.alice.post(
      '/v1/organizations/current/close',
      { name: ' Alpha Pvt Ltd ' },
      world.alpha,
    );
    expect(closed.status).toBe(204);

    expect(await names(world.alice)).toEqual([]);
    expect(await names(world.bob)).toEqual(['Beta Industries']);
    expect((await world.alice.get('/v1/breaches', world.alpha)).status).toBe(403);
    expect((await world.bob.get('/v1/breaches', world.alpha)).status).toBe(403);
    expect((await world.app.withKey(key).get('/v1/breaches?tab=open')).status).toBe(401);
    expect((await world.bob.get('/v1/breaches?tab=open', world.beta)).status).toBe(200);
  });

  it('can be followed by making a new organisation', async () => {
    const made = await world.alice.post<OrganizationSummary>('/v1/organizations', {
      name: 'Alpha Pvt Ltd',
    });
    expect(made.status).toBe(201);
    expect(await names(world.alice)).toEqual(['Alpha Pvt Ltd']);
  });
});
