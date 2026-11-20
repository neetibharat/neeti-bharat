import { describe, expect, it, vi } from 'vitest';
import { docx } from '../../../test/support/office-files';
import { AppException } from '../../core/common/app.exception';
import { AiProviderError, type AiClient } from '../providers/ai-client';
import type { ProfileService } from '../../profile/services/profile.service';
import { AiRunner } from './ai-runner.service';
import type { AiSettingsService } from './ai-settings.service';
import { PolicyImportService } from './policy-import.service';

const actor = { id: 'u1', label: 'Asha' };
const target = { provider: 'deepseek' as const, model: 'deepseek-flash', apiKey: 'sk-key' };
const TEXT =
  'The Privacy lead keeps the register of every transfer of personal data outside India.';
const upload = () => {
  const buffer = docx([{ text: TEXT }]);
  return { originalname: 'policy.docx', buffer, size: buffer.length };
};
const GOOD = JSON.stringify({
  title: 'Transfers',
  titleFromFile: false,
  summary: 'Where data may go.',
  summaryFromFile: false,
  ownerRole: null,
  approverTitle: '',
  text: '## Purpose\n\nText.',
});

function build(complete: () => Promise<string>, configured = true) {
  const settings = {
    assertOn: vi.fn().mockResolvedValue(undefined),
    recordUse: vi.fn().mockResolvedValue(undefined),
    target: vi
      .fn()
      .mockImplementation(() =>
        configured
          ? Promise.resolve(target)
          : Promise.reject(new AppException('AI_NOT_CONFIGURED', 409)),
      ),
  };
  const client = { completeJson: vi.fn(complete) };
  const profile = {
    list: vi.fn().mockResolvedValue({ entries: [{ key: 'companyName', value: 'Acme Pvt Ltd' }] }),
  };
  const runner = new AiRunner(
    settings as unknown as AiSettingsService,
    client as unknown as AiClient,
  );
  const service = new PolicyImportService(runner, profile as unknown as ProfileService);
  return { service, client, settings };
}

describe('PolicyImportService', () => {
  it('reads the file, asks the AI with the company key, and returns the suggestion', async () => {
    const { service, client } = build(() => Promise.resolve(GOOD));
    const result = await service.read(upload(), actor);
    expect(result).toMatchObject({ title: 'Transfers', titleFromFile: false });
    expect(client.completeJson).toHaveBeenCalledWith(
      target,
      expect.objectContaining({ user: expect.stringContaining(TEXT) }),
    );
  });

  it('tells the AI the company answers, so it writes the key and not the value', async () => {
    const { service, client } = build(() => Promise.resolve(GOOD));
    await service.read(upload(), actor);
    expect(client.completeJson).toHaveBeenCalledWith(
      target,
      expect.objectContaining({ system: expect.stringContaining('{{companyName}}') }),
    );
  });

  it('needs a file', async () => {
    const { service } = build(() => Promise.resolve(GOOD));
    await expect(service.read(undefined, actor)).rejects.toMatchObject({ code: 'FILE_REQUIRED' });
  });

  it('does not read the file, or call the AI, when none is set up', async () => {
    const { service, client } = build(() => Promise.resolve(GOOD), false);
    await expect(service.read(upload(), actor)).rejects.toMatchObject({
      code: 'AI_NOT_CONFIGURED',
    });
    expect(client.completeJson).not.toHaveBeenCalled();
  });

  it('passes on why the service failed', async () => {
    const { service } = build(() => Promise.reject(new AiProviderError('busy')));
    await expect(service.read(upload(), actor)).rejects.toMatchObject({
      code: 'AI_FAILED',
      params: { reason: 'busy', detail: '' },
    });
  });

  it('calls an answer that is not usable the failure of the service', async () => {
    const { service } = build(() => Promise.resolve('Sorry, I cannot help.'));
    await expect(service.read(upload(), actor)).rejects.toMatchObject({
      code: 'AI_FAILED',
      params: { reason: 'unusable' },
    });
  });
});
