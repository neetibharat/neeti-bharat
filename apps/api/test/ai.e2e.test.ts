import type {
  AiSettingsResponse,
  CreatedApiKeyResponse,
  OrganizationSummary,
  PolicyDetailResponse,
  PolicyImportResponse,
} from '@dpdp-kit/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { POLICY_REPLY, REFUSED_KEY, fakeAi } from './support/fake-ai-client';
import { docx } from './support/office-files';
import { startTestApp, type Client, type TestApp } from './support/test-app';

const KEY = 'sk-a-key-that-must-never-come-back-9f3k';
const SETTINGS = { provider: 'deepseek', model: 'deepseek-flash', apiKey: KEY };
const POLICY_TEXT =
  'Techdome may store or access personal data outside India only where no restriction applies.';

const world = {} as { app: TestApp; alice: Client; bob: Client; agent: Client; org: string };

const fileForm = (name: string, content: Buffer | string) => {
  const form = new FormData();
  form.set('file', new Blob([content]), name);
  return form;
};

const policyFile = () =>
  fileForm(
    'policy.docx',
    docx([{ text: 'Cross-Border Transfer Policy', style: 'Title' }, { text: POLICY_TEXT }]),
  );

beforeAll(async () => {
  world.app = await startTestApp();
  world.alice = await world.app.signIn('alice@alpha.test');
  world.org = (
    await world.alice.post<OrganizationSummary>('/v1/organizations', { name: 'AI Pvt Ltd' })
  ).body.id;
  await world.alice.post(
    '/v1/people',
    { name: 'Bob', email: 'bob@beta.test', access: 'member' },
    world.org,
  );
  world.bob = await world.app.signIn('bob@beta.test');
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

describe('before an AI service is set up', () => {
  it('says none is set, and refuses to read a file', async () => {
    const state = await world.alice.get<AiSettingsResponse>('/v1/ai', world.org);
    expect(state.body).toEqual({
      enabled: true,
      provider: null,
      model: null,
      keyHint: null,
      configuredByName: null,
      disabledFeatures: [],
    });
    const imported = await world.alice.upload('/v1/policies/import', policyFile(), world.org);
    expect(imported.status).toBe(409);
    expect(imported.body).toMatchObject({ code: 'AI_NOT_CONFIGURED' });
  });
});

describe('setting up the AI service', () => {
  it('refuses a key the service does not accept, and keeps nothing', async () => {
    const refused = await world.alice.put(
      '/v1/ai',
      { ...SETTINGS, apiKey: REFUSED_KEY },
      world.org,
    );
    expect(refused.status).toBe(400);
    expect(refused.body).toMatchObject({
      code: 'AI_FAILED',
      params: { reason: 'key', detail: '' },
    });
    const state = await world.alice.get<AiSettingsResponse>('/v1/ai', world.org);
    expect(state.body.provider).toBeNull();
  });

  it('rejects a provider or model that is not allowed', async () => {
    for (const body of [
      { ...SETTINGS, provider: 'nobody' },
      { ...SETTINGS, model: '../../etc/passwd' },
      { ...SETTINGS, apiKey: 'has a space' },
    ]) {
      expect((await world.alice.put('/v1/ai', body, world.org)).status).toBe(400);
    }
  });

  it('is for admins, and never for an API key', async () => {
    expect((await world.bob.put('/v1/ai', SETTINGS, world.org)).status).toBe(403);
    expect((await world.agent.put('/v1/ai', SETTINGS)).status).toBe(403);
    expect((await world.agent.delete('/v1/ai')).status).toBe(403);
  });

  it('keeps a working key, and shows only its last four characters', async () => {
    const saved = await world.alice.put<AiSettingsResponse>('/v1/ai', SETTINGS, world.org);
    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({
      enabled: true,
      provider: 'deepseek',
      model: 'deepseek-flash',
      keyHint: '9f3k',
    });
    expect(saved.text).not.toContain(KEY);
    const seen = await world.bob.get<AiSettingsResponse>('/v1/ai', world.org);
    expect(seen.body.provider).toBe('deepseek');
    expect(seen.text).not.toContain(KEY);
  });
});

describe('reading a policy from a file', () => {
  it('suggests the details and the text, and asks the AI with the company key', async () => {
    fakeAi.asked.length = 0;
    fakeAi.reply = JSON.stringify(POLICY_REPLY);
    const read = await world.alice.upload<PolicyImportResponse>(
      '/v1/policies/import',
      policyFile(),
      world.org,
    );
    expect(read.status).toBe(201);
    expect(read.body).toMatchObject({
      title: 'Cross-Border Transfer Policy',
      ownerRole: 'PRIVACY_LEAD',
      approverTitle: 'Data Protection Officer',
      titleFromFile: true,
    });
    expect(read.body.content.content.map((node) => node.type)).toEqual([
      'heading',
      'paragraph',
      'heading',
      'bulletList',
    ]);
    expect(fakeAi.asked).toHaveLength(1);
    expect(fakeAi.asked[0]?.target).toEqual({
      provider: 'deepseek',
      model: 'deepseek-flash',
      apiKey: KEY,
    });
    expect(fakeAi.asked[0]?.prompt.user).toContain(POLICY_TEXT);
  });

  it('saves nothing by itself', async () => {
    const before = await world.alice.get<{ policies: unknown[] }>('/v1/policies', world.org);
    await world.alice.upload('/v1/policies/import', policyFile(), world.org);
    const after = await world.alice.get<{ policies: unknown[] }>('/v1/policies', world.org);
    expect(after.body.policies).toHaveLength(before.body.policies.length);
  });

  it('is for people, not for an API key', async () => {
    expect((await world.agent.upload('/v1/policies/import', policyFile())).status).toBe(403);
  });

  it('refuses a missing file, a file of another type and an answer it cannot use', async () => {
    const none = await world.alice.upload('/v1/policies/import', new FormData(), world.org);
    expect(none.body).toMatchObject({ code: 'FILE_REQUIRED' });
    const text = await world.alice.upload(
      '/v1/policies/import',
      fileForm('notes.txt', POLICY_TEXT),
      world.org,
    );
    expect(text.body).toMatchObject({ code: 'FILE_TYPE_NOT_ALLOWED' });
    fakeAi.reply = 'Sorry, I cannot help with that.';
    const unusable = await world.alice.upload('/v1/policies/import', policyFile(), world.org);
    expect(unusable.status).toBe(502);
    expect(unusable.body).toMatchObject({ code: 'AI_FAILED' });
    fakeAi.reply = JSON.stringify(POLICY_REPLY);
  });
});

describe('adding the policy that was read', () => {
  it('starts it as a draft that already has its text', async () => {
    const read = await world.alice.upload<PolicyImportResponse>(
      '/v1/policies/import',
      policyFile(),
      world.org,
    );
    const { title, summary, ownerRole, approverTitle, content } = read.body;
    const created = await world.alice.post<PolicyDetailResponse>(
      '/v1/policies',
      { frameworkId: 'dpdp', title, summary, ownerRole, approverTitle, content },
      world.org,
    );
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ status: 'draft', isCustom: true, title });
    expect(created.body.content).toEqual(content);
    expect(created.body.editedByName).toBeTruthy();
  });

  it('refuses text that is not an editor document', async () => {
    const bad = await world.alice.post(
      '/v1/policies',
      {
        frameworkId: 'dpdp',
        title: 'T',
        summary: 'S',
        ownerRole: 'DPO',
        approverTitle: 'A',
        content: { type: 'paragraph' },
      },
      world.org,
    );
    expect(bad.status).toBe(400);
  });
});

describe('taking the AI service away', () => {
  it('forgets the key, and the log says who did what', async () => {
    expect((await world.alice.delete('/v1/ai', world.org)).status).toBe(204);
    const state = await world.alice.get<AiSettingsResponse>('/v1/ai', world.org);
    expect(state.body.provider).toBeNull();
    const again = await world.alice.upload('/v1/policies/import', policyFile(), world.org);
    expect(again.body).toMatchObject({ code: 'AI_NOT_CONFIGURED' });
    const log = await world.alice.get('/v1/activity?limit=100', world.org);
    expect(log.text).toContain('AI_CONFIGURED');
    expect(log.text).toContain('AI_REMOVED');
    expect(log.text).not.toContain(KEY);
  });
});
