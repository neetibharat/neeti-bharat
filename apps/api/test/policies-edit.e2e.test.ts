import type {
  CreatedApiKeyResponse,
  OrganizationSummary,
  PolicyDetailResponse,
  PolicyListResponse,
} from '@dpdp-kit/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp, type Client, type TestApp } from './support/test-app';

const world = {} as { app: TestApp; alice: Client; agent: Client; org: string };

const body = (over: Record<string, string> = {}) => ({
  frameworkId: 'dpdp',
  title: 'Vendor data sharing',
  summary: 'When and how personal data may be shared with a vendor.',
  ownerRole: 'DPO',
  approverTitle: 'General Counsel',
  ...over,
});

beforeAll(async () => {
  world.app = await startTestApp();
  world.alice = await world.app.signIn('alice@alpha.test');
  world.org = (
    await world.alice.post<OrganizationSummary>('/v1/organizations', { name: 'Policies Pvt Ltd' })
  ).body.id;
  const made = await world.alice.post<CreatedApiKeyResponse>(
    '/v1/api-keys',
    { name: 'Lawyer', role: 'admin' },
    world.org,
  );
  world.agent = world.app.withKey(made.body.key);
});

afterAll(async () => {
  await world.app?.stop();
});

describe('a policy of the company’s own, through an API key', () => {
  it('can be added, edited, archived and restored', async () => {
    const created = await world.agent.post<PolicyDetailResponse>('/v1/policies', body());
    expect(created.status).toBe(201);
    const id = created.body.id;
    expect(created.body).toMatchObject({ status: 'draft', isCustom: true, controlCount: 0 });

    const edited = await world.agent.put<PolicyDetailResponse>(`/v1/policies/${id}/details`, {
      ...body({ title: 'Vendor sharing rules' }),
    });
    expect(edited.status).toBe(200);
    expect(edited.body.title).toBe('Vendor sharing rules');

    expect((await world.agent.post(`/v1/policies/${id}/archive`)).status).toBe(204);
    const listed = await world.agent.get<PolicyListResponse>('/v1/policies');
    expect(listed.body.policies.map((policy) => policy.id)).not.toContain(id);
    const archived = await world.agent.get<PolicyListResponse>('/v1/policies/archived');
    expect(archived.body.policies.map((policy) => policy.id)).toContain(id);
    expect((await world.agent.get(`/v1/policies/${id}`)).status).toBe(404);

    expect((await world.agent.post(`/v1/policies/${id}/restore`)).status).toBe(204);
    expect((await world.agent.get(`/v1/policies/${id}`)).status).toBe(200);
  });

  it('writes each change to the activity log', async () => {
    const log = await world.alice.get('/v1/activity?limit=100', world.org);
    for (const action of [
      'POLICY_CREATED',
      'POLICY_DETAILS_EDITED',
      'POLICY_ARCHIVED',
      'POLICY_RESTORED',
    ]) {
      expect(log.text).toContain(action);
    }
  });

  it('can be linked to a control, and is then covered by it', async () => {
    const policy = (await world.agent.post<PolicyDetailResponse>('/v1/policies', body())).body;
    const control = await world.agent.post<{ id: string }>('/v1/controls', {
      requirementId: 'R6',
      title: 'Vendor contracts reviewed',
      description: 'Each vendor contract is checked.',
      assigneeId: null,
      reviewDate: null,
      policyIds: [policy.id],
    });
    expect(control.status).toBe(201);
    const covered = await world.agent.get<{ items: { control: { id: string } }[] }>(
      `/v1/policies/${policy.id}/coverage`,
    );
    expect(covered.body.items.map((item) => item.control.id)).toContain(control.body.id);
  });

  it('refuses a framework that does not exist and text that is empty', async () => {
    expect(
      (await world.agent.post('/v1/policies', body({ frameworkId: 'nowhere' }))).status,
    ).toBeGreaterThanOrEqual(400);
    expect((await world.agent.post('/v1/policies', body({ title: '  ' }))).status).toBe(400);
  });

  it('is closed to an auditor key', async () => {
    const made = await world.alice.post<CreatedApiKeyResponse>(
      '/v1/api-keys',
      { name: 'Reader', role: 'auditor' },
      world.org,
    );
    const reader = world.app.withKey(made.body.key);
    expect((await reader.post('/v1/policies', body())).status).toBe(403);
    expect((await reader.get('/v1/policies')).status).toBe(200);
  });
});
