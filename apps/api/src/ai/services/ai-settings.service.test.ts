import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import type { Env } from '../../core/config/env.validation';
import { runInOrganization } from '../../core/org/org-context';
import type { AiSettingRepository } from '../repositories/ai-setting.repository';
import { AiSettingsService } from './ai-settings.service';

const actor = { id: 'u1', label: 'Asha' };
const ENV = {
  AI_PROVIDER: 'deepseek',
  AI_MODEL: 'deepseek-flash',
  AI_API_KEY: 'sk-secret-key-1234',
};

function build(env: Partial<Record<keyof typeof ENV, string>> = ENV) {
  const state: { row: Record<string, unknown> | null } = { row: null };
  const settings = {
    find: vi.fn().mockImplementation(() => Promise.resolve(state.row)),
    setEnabledFeatures: vi.fn().mockImplementation((enabledFeatures: string[], name: string) => {
      state.row = { enabledFeatures, updatedByName: name };
      return Promise.resolve(state.row);
    }),
  };
  const config = { get: (key: string) => (env as Record<string, string | undefined>)[key] };
  const activity = { record: vi.fn().mockResolvedValue(undefined) };
  const service = new AiSettingsService(
    settings as unknown as AiSettingRepository,
    config as unknown as ConfigService<Env, true>,
    activity as unknown as ActivityService,
  );
  return { service, settings, activity, state };
}

const inOrg = <T>(work: () => Promise<T>) => runInOrganization('org-1', work);

describe('AiSettingsService', () => {
  it('reads the service from the environment and shows only the end of the key', async () => {
    const { service } = build();
    const shown = await inOrg(() => service.get());
    expect(shown).toEqual({
      provider: 'deepseek',
      model: 'deepseek-flash',
      keyHint: '1234',
      enabledFeatures: [],
    });
    expect(JSON.stringify(shown)).not.toContain('sk-secret');
  });

  it('uses the service’s suggested model when none is named', () => {
    const { service } = build({ AI_PROVIDER: 'anthropic', AI_API_KEY: 'k' });
    expect(service.target()).toEqual({
      provider: 'anthropic',
      model: 'claude-haiku-5-5',
      apiKey: 'k',
    });
  });

  it('shows nothing set up, and no feature on, when the environment has no key', async () => {
    const { service, state } = build({});
    state.row = { enabledFeatures: ['proof_check'] };
    expect(await inOrg(() => service.get())).toEqual({
      provider: null,
      model: null,
      keyHint: null,
      enabledFeatures: [],
    });
    expect(() => service.target()).toThrowError(
      expect.objectContaining({ code: 'AI_NOT_CONFIGURED' }),
    );
  });

  it('shows which features are on, leaving out any that no longer exist', async () => {
    const { service, state } = build();
    state.row = { enabledFeatures: ['proof_check', 'made_up'] };
    expect((await inOrg(() => service.get())).enabledFeatures).toEqual(['proof_check']);
  });

  it('refuses a feature that is not on, and any feature while nothing is set up', async () => {
    const { service, state } = build();
    await expect(inOrg(() => service.assertOn('policy_tailor'))).rejects.toMatchObject({
      code: 'AI_FEATURE_OFF',
    });
    state.row = { enabledFeatures: ['policy_check'] };
    await expect(inOrg(() => service.assertOn('policy_tailor'))).rejects.toMatchObject({
      code: 'AI_FEATURE_OFF',
    });
    await expect(inOrg(() => service.assertOn('policy_check'))).resolves.toBeUndefined();
    await expect(inOrg(() => build({}).service.assertOn('policy_check'))).rejects.toMatchObject({
      code: 'AI_NOT_CONFIGURED',
    });
  });

  it('switches features on, in the order they are listed, and logs who did it', async () => {
    const { service, settings, activity } = build();
    const result = await inOrg(() => service.setFeatures(['proof_check', 'policy_check'], actor));
    expect(settings.setEnabledFeatures).toHaveBeenCalledWith(
      ['policy_check', 'proof_check'],
      'Asha',
    );
    expect(result.enabledFeatures).toEqual(['policy_check', 'proof_check']);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'AI_FEATURES_CHANGED',
        details: { on: 'policy_check, proof_check' },
      }),
    );
  });

  it('will not switch a feature on while the environment has no AI service', async () => {
    const { service, settings } = build({});
    await expect(inOrg(() => service.setFeatures(['proof_check'], actor))).rejects.toMatchObject({
      code: 'AI_NOT_CONFIGURED',
    });
    expect(settings.setEnabledFeatures).not.toHaveBeenCalled();
  });
});
