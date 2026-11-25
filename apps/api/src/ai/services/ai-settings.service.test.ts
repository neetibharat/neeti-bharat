import { randomBytes } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import { runInOrganization } from '../../core/org/org-context';
import { AesSecretBox, DisabledSecretBox, type SecretBox } from '../../core/secrets/secret-box';
import { AiProviderError, type AiClient } from '../providers/ai-client';
import type { AiSettingRepository } from '../repositories/ai-setting.repository';
import { AiSettingsService } from './ai-settings.service';

const actor = { id: 'u1', label: 'Asha' };
const input = {
  provider: 'deepseek' as const,
  model: 'deepseek-flash',
  apiKey: 'sk-secret-key-1234',
};

function build(options: { secrets?: SecretBox; verify?: () => Promise<void> } = {}) {
  const secrets = options.secrets ?? new AesSecretBox(randomBytes(32).toString('base64'));
  const state: { row: Record<string, unknown> | null } = { row: null };
  const settings = {
    find: vi.fn().mockImplementation(() => Promise.resolve(state.row)),
    saveWith: vi.fn().mockImplementation(async (data: object, alongside: () => Promise<void>) => {
      state.row = { ...data };
      await alongside();
      return state.row;
    }),
    remove: vi.fn().mockImplementation(() => {
      state.row = null;
      return Promise.resolve();
    }),
  };
  const client = {
    verify: vi.fn(options.verify ?? (() => Promise.resolve())),
    completeJson: vi.fn(),
  };
  const activity = { record: vi.fn().mockResolvedValue(undefined) };
  const service = new AiSettingsService(
    settings as unknown as AiSettingRepository,
    secrets,
    client as unknown as AiClient,
    activity as unknown as ActivityService,
  );
  return { service, settings, client, activity, state };
}

const inOrg = <T>(work: () => Promise<T>) => runInOrganization('org-1', work);

describe('AiSettingsService', () => {
  it('tries the key first, then keeps it sealed and says who set it', async () => {
    const { service, client, state, activity } = build();
    const saved = await inOrg(() => service.save(input, actor));
    expect(client.verify).toHaveBeenCalledWith(input);
    expect(state.row?.apiKey).not.toContain('sk-secret');
    expect(state.row).toMatchObject({
      provider: 'deepseek',
      keyHint: '1234',
      updatedByName: 'Asha',
    });
    expect(saved).toMatchObject({
      provider: 'deepseek',
      model: 'deepseek-flash',
      keyHint: '1234',
    });
    expect(JSON.stringify(saved)).not.toContain('sk-secret');
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'AI_CONFIGURED',
        details: { provider: 'deepseek', model: 'deepseek-flash' },
      }),
    );
  });

  it('keeps nothing when the service refuses the key, and says why', async () => {
    const { service, settings, activity } = build({
      verify: () => Promise.reject(new AiProviderError('key')),
    });
    await expect(inOrg(() => service.save(input, actor))).rejects.toMatchObject({
      code: 'AI_FAILED',
      params: { reason: 'key', detail: '' },
    });
    expect(settings.saveWith).not.toHaveBeenCalled();
    expect(activity.record).not.toHaveBeenCalled();
  });

  it('refuses when the install has no secrets key, before calling the service', async () => {
    const { service, client } = build({ secrets: new DisabledSecretBox() });
    await expect(inOrg(() => service.save(input, actor))).rejects.toMatchObject({
      code: 'SECRETS_NOT_CONFIGURED',
    });
    expect(client.verify).not.toHaveBeenCalled();
  });

  it('opens the key for a call, and only in the organisation that sealed it', async () => {
    const { service } = build();
    await inOrg(() => service.save(input, actor));
    await expect(inOrg(() => service.target())).resolves.toEqual(input);
    await expect(runInOrganization('org-2', () => service.target())).rejects.toThrow();
  });

  it('says it is not set up when there is no setting', async () => {
    const { service } = build();
    await expect(inOrg(() => service.target())).rejects.toMatchObject({
      code: 'AI_NOT_CONFIGURED',
    });
    await expect(inOrg(() => service.get())).resolves.toMatchObject({
      enabled: true,
      provider: null,
      model: null,
      keyHint: null,
    });
  });

  it('forgets the key and writes it to the log', async () => {
    const { service, state, activity } = build();
    await inOrg(() => service.save(input, actor));
    await inOrg(() => service.remove(actor));
    expect(state.row).toBeNull();
    expect(activity.record).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'AI_REMOVED' }),
    );
  });
});

describe('AiSettingsService features', () => {
  const saved = (disabled: string[] = []) => ({
    provider: 'deepseek',
    model: 'deepseek-flash',
    apiKey: 'sealed',
    keyHint: '1234',
    updatedByName: 'Asha',
    disabledFeatures: disabled,
  });

  it('shows which features are switched off, and no key', async () => {
    const { service, state } = build();
    state.row = saved(['proof_check', 'made_up']);
    const shown = await inOrg(() => service.get());
    expect(shown.disabledFeatures).toEqual(['proof_check']);
    expect(JSON.stringify(shown)).not.toContain('sealed');
  });

  it('refuses a feature that is off, and any feature while nothing is set up', async () => {
    const { service, state } = build();
    await expect(inOrg(() => service.assertOn('policy_tailor'))).rejects.toMatchObject({
      code: 'AI_NOT_CONFIGURED',
    });
    state.row = saved(['policy_tailor']);
    await expect(inOrg(() => service.assertOn('policy_tailor'))).rejects.toMatchObject({
      code: 'AI_FEATURE_OFF',
    });
    await expect(inOrg(() => service.assertOn('policy_check'))).resolves.toBeUndefined();
  });

  it('switches features off in the setting, leaves the key alone, and logs who did it', async () => {
    const { service, state, settings, activity } = build();
    state.row = saved();
    (settings as Record<string, unknown>).setDisabledFeatures = vi
      .fn()
      .mockImplementation((features: string[]) => {
        state.row = { ...state.row, disabledFeatures: features };
        return Promise.resolve(state.row);
      });
    const result = await inOrg(() => service.setFeatures(['proof_check', 'policy_check'], actor));
    expect(result.disabledFeatures).toEqual(['policy_check', 'proof_check']);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'AI_FEATURES_CHANGED',
        details: { off: 'policy_check, proof_check' },
      }),
    );
  });
});
