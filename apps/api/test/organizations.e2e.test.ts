import { READINESS_QUESTIONS } from '@dpdp-kit/shared';
import type { OrganizationSummary } from '@dpdp-kit/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp, type Client, type TestApp } from './support/test-app';

interface Names {
  items: { title?: string; personName?: string; number?: number; name?: string }[];
}

interface ControlRow {
  id: string;
  description: string;
  assignee: { id: string } | null;
  reviewDate: string | null;
  policies: { id: string }[];
  ownerRole: string;
}

const allYes = Object.fromEntries(READINESS_QUESTIONS.map((question) => [question.id, 'yes']));

/** Two organisations with their own people and records, and three people between them. */
const world = {} as {
  app: TestApp;
  alice: Client;
  bob: Client;
  alpha: string;
  beta: string;
};

async function createOrganization(person: Client, name: string): Promise<string> {
  const made = await person.post<OrganizationSummary>('/v1/organizations', { name });
  expect(made.status).toBe(201);
  return made.body.id;
}

beforeAll(async () => {
  world.app = await startTestApp();
  // The first person to sign in claims the install and makes the first organisation.
  world.alice = await world.app.signIn('alice@alpha.test');
  world.alpha = await createOrganization(world.alice, 'Alpha Pvt Ltd');
  // Bob is invited to Alpha as a member, signs in, and then makes an organisation of his own.
  const invited = await world.alice.post(
    '/v1/people',
    { name: 'Bob', email: 'bob@beta.test', access: 'member' },
    world.alpha,
  );
  expect(invited.status).toBe(201);
  world.bob = await world.app.signIn('bob@beta.test');
  world.beta = await createOrganization(world.bob, 'Beta Industries');

  const breach = (title: string) => ({
    title,
    description: 'What happened',
    affectedSystems: 'A system',
    affectedData: 'Some data',
  });
  const request = (person: string) => ({
    type: 'access',
    personName: person,
    personEmail: `${person.toLowerCase()}@example.test`,
    details: 'Please send me my data',
  });
  await world.alice.post('/v1/breaches', breach('Alpha breach'), world.alpha);
  await world.alice.post('/v1/requests', request('Anita'), world.alpha);
  await world.alice.post('/v1/requests', request('Arun'), world.alpha);
  await world.alice.put(
    '/v1/profile/entries/website',
    { value: 'https://alpha.test' },
    world.alpha,
  );
  await world.alice.post('/v1/readiness', { answers: allYes }, world.alpha);
  await world.bob.post('/v1/breaches', breach('Beta breach'), world.beta);
  await world.bob.post('/v1/requests', request('Bela'), world.beta);
  await world.bob.put('/v1/profile/entries/website', { value: 'https://beta.test' }, world.beta);
});

afterAll(async () => {
  await world.app?.stop();
});

describe('who can open which organisation', () => {
  it('refuses a request with no sign-in', async () => {
    expect((await world.app.anonymous.get('/v1/breaches')).status).toBe(401);
  });

  it('lists the organisations a person belongs to, with their role in each', async () => {
    const alice = await world.alice.get<{ organizations: OrganizationSummary[] }>('/v1/me');
    expect(alice.body.organizations.map((org) => [org.name, org.role])).toEqual([
      ['Alpha Pvt Ltd', 'admin'],
    ]);
    const bob = await world.bob.get<{ organizations: OrganizationSummary[] }>('/v1/me');
    expect(bob.body.organizations.map((org) => [org.name, org.role]).sort()).toEqual([
      ['Alpha Pvt Ltd', 'member'],
      ['Beta Industries', 'admin'],
    ]);
  });

  it('lets a person in several organisations use the sign-in routes, which belong to none', async () => {
    const session = await world.bob.get<{ user?: { email: string } }>('/api/auth/get-session');
    expect([session.status, session.body.user?.email]).toEqual([200, 'bob@beta.test']);
    const social = await world.bob.post('/api/auth/sign-in/social', { provider: 'microsoft' });
    expect(social.status).not.toBe(400);
  });

  it('refuses an organisation the person does not belong to', async () => {
    expect((await world.alice.get('/v1/breaches', world.beta)).status).toBe(403);
    expect((await world.alice.get('/v1/breaches', 'no-such-organisation')).status).toBe(403);
  });

  it('asks a person with several organisations to say which, and lets one with a single one omit it', async () => {
    const asked = await world.bob.get<{ code: string }>('/v1/breaches');
    expect([asked.status, asked.body.code]).toEqual([400, 'ORGANIZATION_REQUIRED']);
    expect((await world.alice.get('/v1/breaches')).status).toBe(200);
  });

  it('checks the role a person has in the organisation asked for, not in another', async () => {
    const asMember = await world.bob.post(
      '/v1/people',
      { name: 'Eve', email: 'eve@alpha.test', access: 'member' },
      world.alpha,
    );
    expect(asMember.status).toBe(403);
    const asAdmin = await world.bob.post(
      '/v1/people',
      { name: 'Eve', email: 'eve@beta.test', access: 'member' },
      world.beta,
    );
    expect(asAdmin.status).toBe(201);
  });
});

describe('what each organisation sees', () => {
  it('keeps breaches, requests and people apart', async () => {
    const titles = async (client: Client, org: string) =>
      (await client.get<Names>('/v1/breaches?tab=open', org)).body.items.map((item) => item.title);
    expect(await titles(world.alice, world.alpha)).toEqual(['Alpha breach']);
    expect(await titles(world.bob, world.beta)).toEqual(['Beta breach']);

    const people = async (client: Client, org: string) =>
      (await client.get<{ people: { name: string }[] }>('/v1/people', org)).body.people.map(
        (p) => p.name,
      );
    expect(await people(world.bob, world.beta)).not.toContain('Alice');
    expect(await people(world.alice, world.alpha)).not.toContain('Eve');
  });

  it('cannot open another organisation’s record by its id', async () => {
    const alphaBreach = (
      await world.alice.get<Names & { items: { id: string }[] }>(
        '/v1/breaches?tab=open',
        world.alpha,
      )
    ).body.items[0]!;
    expect((await world.alice.get(`/v1/breaches/${alphaBreach.id}`, world.alpha)).status).toBe(200);
    expect((await world.bob.get(`/v1/breaches/${alphaBreach.id}`, world.beta)).status).toBe(404);
  });

  it('gives each organisation its own company profile', async () => {
    const website = async (client: Client, org: string) =>
      (
        await client.get<{ entries: { key: string; value: string }[] }>('/v1/profile', org)
      ).body.entries.find((entry) => entry.key === 'website')?.value;
    expect(await website(world.alice, world.alpha)).toBe('https://alpha.test');
    expect(await website(world.bob, world.beta)).toBe('https://beta.test');
  });

  it('keeps readiness checks apart', async () => {
    const alpha = await world.alice.get<{ latest: { score: number } | null }>(
      '/v1/readiness',
      world.alpha,
    );
    const beta = await world.bob.get<{ latest: { score: number } | null }>(
      '/v1/readiness',
      world.beta,
    );
    expect(alpha.body.latest?.score).toBe(100);
    expect(beta.body.latest).toBeNull();
  });

  it('starts each organisation’s REQ numbers at 1', async () => {
    const numbers = async (client: Client, org: string) =>
      (await client.get<Names>('/v1/requests', org)).body.items.map((item) => item.number).sort();
    expect(await numbers(world.alice, world.alpha)).toEqual([1, 2]);
    expect(await numbers(world.bob, world.beta)).toEqual([1]);
  });

  it('gives each organisation its own copy of the checklist, which the other cannot change', async () => {
    const controls = async (client: Client, org: string) =>
      (
        await client.get<{ rules: { controls: { id: string }[] }[] }>('/v1/frameworks/dpdp', org)
      ).body.rules.flatMap((rule) => rule.controls.map((control) => control.id));
    const alpha = await controls(world.alice, world.alpha);
    expect(alpha.length).toBeGreaterThan(40);
    expect(await controls(world.bob, world.beta)).toEqual(alpha);
    // The control is edited as it stands, with only its title changed.
    const current = (
      await world.alice.get<{ rules: { controls: ControlRow[] }[] }>(
        '/v1/frameworks/dpdp',
        world.alpha,
      )
    ).body.rules
      .flatMap((rule) => rule.controls)
      .find((control) => control.id === alpha[0])!;
    const edited = await world.alice.put(
      `/v1/controls/${current.id}/details`,
      {
        title: 'Alpha only',
        description: current.description,
        assigneeId: current.assignee?.id ?? null,
        reviewDate: current.reviewDate,
        policyIds: current.policies.map((policy) => policy.id),
        ownerRole: current.ownerRole,
      },
      world.alpha,
    );
    expect([edited.status, edited.text.slice(0, 120)]).toEqual([200, expect.anything()]);
    const titleIn = async (client: Client, org: string) =>
      (
        await client.get<{ rules: { controls: { id: string; title: string }[] }[] }>(
          '/v1/frameworks/dpdp',
          org,
        )
      ).body.rules
        .flatMap((rule) => rule.controls)
        .find((control) => control.id === alpha[0])?.title;
    expect(await titleIn(world.alice, world.alpha)).toBe('Alpha only');
    expect(await titleIn(world.bob, world.beta)).not.toBe('Alpha only');
  });
});

describe('the activity log', () => {
  it('is a separate chain for each organisation, and both hold up', async () => {
    const alpha = await world.alice.get<{ ok: boolean; checked: number }>(
      '/v1/activity/verify',
      world.alpha,
    );
    const beta = await world.bob.get<{ ok: boolean; checked: number }>(
      '/v1/activity/verify',
      world.beta,
    );
    expect(alpha.body.ok).toBe(true);
    expect(beta.body.ok).toBe(true);
    expect(alpha.body.checked).not.toBe(beta.body.checked);
  });

  it('shows an organisation only its own events', async () => {
    const actions = async (client: Client, org: string) =>
      (
        await client.get<{ items: { action: string; details?: Record<string, unknown> }[] }>(
          '/v1/activity?limit=100',
          org,
        )
      ).body.items;
    const alpha = await actions(world.alice, world.alpha);
    const beta = await actions(world.bob, world.beta);
    expect(alpha.filter((event) => event.action === 'ORGANIZATION_CREATED')).toHaveLength(1);
    expect(beta.filter((event) => event.action === 'ORGANIZATION_CREATED')).toHaveLength(1);
    expect(JSON.stringify(alpha)).not.toContain('Beta breach');
    expect(JSON.stringify(beta)).not.toContain('Alpha breach');
  });
});

describe('downloads', () => {
  it('hold only the organisation’s own records', async () => {
    const alpha = await world.alice.get('/v1/exports/csv/breaches', world.alpha);
    const beta = await world.bob.get('/v1/exports/csv/breaches', world.beta);
    expect(alpha.text).toContain('Alpha breach');
    expect(alpha.text).not.toContain('Beta breach');
    expect(beta.text).toContain('Beta breach');
    expect(beta.text).not.toContain('Alpha breach');
  });
});

describe('every read route', () => {
  it('answers without a server error for each organisation', async () => {
    const routes = world.app.readRoutes();
    expect(routes.length).toBeGreaterThan(20);
    const failures: string[] = [];
    for (const [client, org] of [
      [world.alice, world.alpha],
      [world.bob, world.beta],
    ] as const) {
      for (const route of routes) {
        const reply = await client.get(
          route,
          route === '/v1/me' || route === '/v1/organizations' ? undefined : org,
        );
        if (reply.status >= 500)
          failures.push(`${route} -> ${reply.status} ${reply.text.slice(0, 120)}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
