import {
  APP_ROLES,
  NOTIFICATION_KINDS,
  type NotificationListResponse,
  type NotificationPreferencesResponse,
  type NotificationRoleDefaultsResponse,
  type NotificationUnreadResponse,
  type OrganizationSummary,
} from '@dpdp-kit/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp, type Client, type TestApp } from './support/test-app';

const world = {} as { app: TestApp; alice: Client; bob: Client; alpha: string };

/** A request received long ago, so its date has passed. */
const lateRequest = (name: string) => ({
  type: 'access',
  personName: name,
  personEmail: `${name.toLowerCase()}@example.test`,
  details: 'Wants a copy of their data',
  receivedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
});

const noticesOf = (who: Client) =>
  who.get<NotificationListResponse>('/v1/notifications', world.alpha);

beforeAll(async () => {
  world.app = await startTestApp();
  world.alice = await world.app.signIn('alice@alpha.test');
  world.alpha = (
    await world.alice.post<OrganizationSummary>('/v1/organizations', { name: 'Alpha Pvt Ltd' })
  ).body.id;
  await world.alice.post(
    '/v1/people',
    { name: 'Bob', email: 'bob@alpha.test', access: 'member' },
    world.alpha,
  );
  world.bob = await world.app.signIn('bob@alpha.test');
  await world.alice.post('/v1/requests', lateRequest('Asha'), world.alpha);
});

afterAll(async () => {
  await world.app?.stop();
});

describe('the daily notices', () => {
  it('tells the person who has late work, once, and counts it as unread', async () => {
    await world.app.scanNotices();
    const mine = await noticesOf(world.alice);
    expect(mine.body.items).toHaveLength(1);
    expect(mine.body.items[0]).toMatchObject({
      kind: 'request',
      state: 'overdue',
      title: 'Asha',
      readAt: null,
    });
    expect(mine.body.unread).toBe(1);

    // Another check the same day makes nothing new.
    await world.app.scanNotices();
    expect((await noticesOf(world.alice)).body.total).toBe(1);
  });

  it('emails it too', () => {
    const mail = world.app
      .mailSent()
      .filter((m) => m.to === 'alice@alpha.test' && /Late/.test(m.subject));
    expect(mail).toHaveLength(1);
    expect(mail[0]!.subject).toContain('Asha');
  });

  it('gives nothing to someone whose work is not late', async () => {
    expect((await noticesOf(world.bob)).body.items).toEqual([]);
  });

  it('keeps each person’s notices to themselves', async () => {
    const id = (await noticesOf(world.alice)).body.items[0]!.id;
    expect(
      (await world.bob.post(`/v1/notifications/${id}/read`, undefined, world.alpha)).status,
    ).toBe(204);
    expect((await noticesOf(world.alice)).body.items[0]!.readAt).toBeNull();
  });
});

describe('reading', () => {
  it('marks one as read, then the unread count drops', async () => {
    const id = (await noticesOf(world.alice)).body.items[0]!.id;
    expect(
      (await world.alice.post(`/v1/notifications/${id}/read`, undefined, world.alpha)).status,
    ).toBe(204);
    const count = await world.alice.get<NotificationUnreadResponse>(
      '/v1/notifications/unread-count',
      world.alpha,
    );
    expect(count.body.unread).toBe(0);
  });

  it('marks everything as read', async () => {
    expect(
      (await world.alice.post('/v1/notifications/read-all', undefined, world.alpha)).status,
    ).toBe(204);
    expect((await noticesOf(world.alice)).body.unread).toBe(0);
  });
});

describe('preferences', () => {
  it('start with everything on, and are kept per person', async () => {
    const before = await world.alice.get<NotificationPreferencesResponse>(
      '/v1/notifications/preferences',
      world.alpha,
    );
    expect(before.body.items.every((p) => p.inApp && p.email)).toBe(true);
    const items = before.body.items.map((p) => (p.kind === 'request' ? { ...p, email: false } : p));
    const saved = await world.alice.put<NotificationPreferencesResponse>(
      '/v1/notifications/preferences',
      { items },
      world.alpha,
    );
    expect(saved.body.items.find((p) => p.kind === 'request')).toMatchObject({
      inApp: true,
      email: false,
    });
    const bobs = await world.bob.get<NotificationPreferencesResponse>(
      '/v1/notifications/preferences',
      world.alpha,
    );
    expect(bobs.body.items.every((p) => p.email)).toBe(true);
  });

  it('refuses a kind listed twice', async () => {
    const twice = {
      items: [
        { kind: 'request', inApp: true, email: true },
        { kind: 'request', inApp: false, email: false },
      ],
    };
    expect(
      (await world.alice.put('/v1/notifications/preferences', twice, world.alpha)).status,
    ).toBe(400);
  });

  it('stops the email, and keeps the notice, once email is off for that kind', async () => {
    await world.alice.post('/v1/requests', lateRequest('Bela'), world.alpha);
    const sentBefore = world.app.mailSent().length;
    await world.app.scanNotices();
    expect((await noticesOf(world.alice)).body.items.some((n) => n.title === 'Bela')).toBe(true);
    expect(world.app.mailSent().length).toBe(sentBefore);
  });
});

describe('role defaults', () => {
  const defaults = (who: Client) =>
    who.get<NotificationRoleDefaultsResponse>('/v1/notifications/role-defaults', world.alpha);
  const prefs = (who: Client) =>
    who.get<NotificationPreferencesResponse>('/v1/notifications/preferences', world.alpha);

  it('are for admins only', async () => {
    expect((await defaults(world.bob)).status).toBe(403);
    const body = { items: [{ role: 'member', kind: 'proof', inApp: true, email: false }] };
    expect((await world.bob.put('/v1/notifications/role-defaults', body, world.alpha)).status).toBe(
      403,
    );
  });

  it('start with every role and kind on, and are changed by an admin', async () => {
    const before = await defaults(world.alice);
    expect(before.body.items).toHaveLength(APP_ROLES.length * NOTIFICATION_KINDS.length);
    expect(before.body.items.every((i) => i.inApp && i.email)).toBe(true);
    const body = { items: [{ role: 'member', kind: 'proof', inApp: true, email: false }] };
    const saved = await world.alice.put<NotificationRoleDefaultsResponse>(
      '/v1/notifications/role-defaults',
      body,
      world.alpha,
    );
    expect(saved.body.items.find((i) => i.role === 'member' && i.kind === 'proof')).toMatchObject({
      email: false,
    });
    expect(saved.body.items.find((i) => i.role === 'admin' && i.kind === 'proof')).toMatchObject({
      email: true,
    });
  });

  it('apply to people of that role until they choose for themselves', async () => {
    expect((await prefs(world.bob)).body.items.find((i) => i.kind === 'proof')).toMatchObject({
      email: false,
    });
    expect((await prefs(world.alice)).body.items.find((i) => i.kind === 'proof')).toMatchObject({
      email: true,
    });
    await world.bob.put(
      '/v1/notifications/preferences',
      { items: [{ kind: 'proof', inApp: true, email: true }] },
      world.alpha,
    );
    expect((await prefs(world.bob)).body.items.find((i) => i.kind === 'proof')).toMatchObject({
      email: true,
    });
  });

  it('are written to the activity log', async () => {
    const log = await world.alice.get('/v1/activity', world.alpha);
    expect(log.text).toContain('NOTIFICATION_DEFAULTS_CHANGED');
  });
});

describe('access', () => {
  it('needs a sign-in', async () => {
    expect((await world.app.anonymous.get('/v1/notifications', world.alpha)).status).toBe(401);
  });
});
