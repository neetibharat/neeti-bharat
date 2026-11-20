import { describe, expect, it, vi } from 'vitest';
import { AppException } from '../../core/common/app.exception';
import { AiProviderError, type AiClient } from '../providers/ai-client';
import { UnusableReply } from '../utils/ai-reply';
import { AiRunner, type AiTask } from './ai-runner.service';
import type { AiSettingsService } from './ai-settings.service';

const actor = { id: 'u1', label: 'Asha' };
const use = { actor, subject: { type: 'policy', id: 'P01' } };

const task: AiTask<{ ok: boolean }> = {
  feature: 'policy_check',
  prompt: { system: 'Reply with JSON.', user: 'hello' },
  parse: (reply) => {
    if (!reply.includes('ok')) throw new UnusableReply();
    return { ok: true };
  },
};

function build(complete: () => Promise<string> = () => Promise.resolve('{"ok":true}')) {
  const targets = {
    current: { provider: 'deepseek' as const, model: 'deepseek-flash', apiKey: 'sk-one' },
  };
  const settings = {
    assertOn: vi.fn().mockResolvedValue(undefined),
    target: vi.fn().mockImplementation(() => Promise.resolve(targets.current)),
    recordUse: vi.fn().mockResolvedValue(undefined),
  };
  const client = {
    completeJson: vi.fn<AiClient['completeJson']>(() => complete()),
  };
  const runner = new AiRunner(
    settings as unknown as AiSettingsService,
    client as unknown as AiClient,
  );
  return { runner, settings, client, targets };
}

describe('AiRunner', () => {
  it('checks the feature is on, asks with the company setting, and logs the use with the service and model', async () => {
    const { runner, settings, client, targets } = build();

    const result = await runner.run(task, use);

    expect(result).toEqual({ ok: true });
    expect(settings.assertOn).toHaveBeenCalledWith('policy_check');
    expect(client.completeJson).toHaveBeenCalledWith(targets.current, task.prompt);
    expect(settings.recordUse).toHaveBeenCalledWith(use, 'policy_check', targets.current);
  });

  it('follows the company setting at the moment of each call, so swapping service or model needs no change here', async () => {
    const { runner, client, targets } = build();

    await runner.run(task, use);
    targets.current = {
      provider: 'anthropic' as never,
      model: 'claude-haiku-5-5',
      apiKey: 'sk-two',
    };
    await runner.run(task, use);

    expect(
      client.completeJson.mock.calls.map(([target]) => [target.provider, target.model]),
    ).toEqual([
      ['deepseek', 'deepseek-flash'],
      ['anthropic', 'claude-haiku-5-5'],
    ]);
  });

  it('does nothing when the feature is switched off or AI is not set up', async () => {
    const { runner, settings, client } = build();
    settings.assertOn.mockRejectedValue(new AppException('AI_FEATURE_OFF', 409));

    await expect(runner.run(task, use)).rejects.toMatchObject({ code: 'AI_FEATURE_OFF' });
    expect(client.completeJson).not.toHaveBeenCalled();
    expect(settings.recordUse).not.toHaveBeenCalled();
  });

  it('turns a refusal by the service into AI_FAILED with its reason, and logs nothing', async () => {
    const { runner, settings } = build(() => Promise.reject(new AiProviderError('busy')));

    await expect(runner.run(task, use)).rejects.toMatchObject({
      code: 'AI_FAILED',
      params: { reason: 'busy' },
    });
    expect(settings.recordUse).not.toHaveBeenCalled();
  });

  it('turns an answer that is not what was asked for into AI_FAILED, unusable, and logs nothing', async () => {
    const { runner, settings } = build(() => Promise.resolve('no idea'));

    await expect(runner.run(task, use)).rejects.toMatchObject({
      code: 'AI_FAILED',
      params: { reason: 'unusable' },
    });
    expect(settings.recordUse).not.toHaveBeenCalled();
  });
});
