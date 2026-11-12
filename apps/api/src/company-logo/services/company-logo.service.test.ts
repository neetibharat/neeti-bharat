import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import { DisabledFileStorage } from '../../core/storage/disabled-file-storage';
import { MemoryFileStorage } from '../../core/storage/memory-file-storage';
import type { CompanyLogoRepository } from '../repositories/company-logo.repository';
import { runInOrganization } from '../../core/org/org-context';
import { CompanyLogoService } from './company-logo.service';

const actor = { id: 'u1', label: 'Asha' };
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const upload = (name = 'logo.png', buffer = PNG) => ({
  originalname: name,
  buffer,
  size: buffer.length,
});

const stored = (over: object = {}) => ({
  id: 1,
  fileKey: 'logo/old/old.png',
  fileName: 'old.png',
  fileType: 'image/png',
  updatedAt: new Date('2026-11-10T10:00:00Z'),
  ...over,
});

function build(row: unknown = null, storage = new MemoryFileStorage()) {
  const logos = {
    find: vi.fn().mockResolvedValue(row),
    save: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  };
  const activity = { record: vi.fn().mockResolvedValue(undefined) };
  const service = new CompanyLogoService(
    logos as unknown as CompanyLogoRepository,
    storage,
    activity as unknown as ActivityService,
  );
  // Setting the logo names the file under the organisation, so it is called as one organisation's request.
  const set = service.set.bind(service);
  service.set = (...args) => runInOrganization('org-1', () => set(...args));
  return { service, logos, storage, activity };
}

describe('CompanyLogoService.get', () => {
  it('has no logo until one is set', async () => {
    expect(await build().service.get()).toEqual({ logo: null });
  });

  it('gives a short-lived link, never the storage key', async () => {
    const { service } = build(stored());
    const { logo } = await service.get();
    expect(logo).toEqual({
      url: expect.stringContaining('https://files.test/logo/old/old.png'),
      fileName: 'old.png',
      updatedAt: '2026-11-10T10:00:00.000Z',
    });
    expect(JSON.stringify(logo)).not.toContain('fileKey');
  });

  it('has no logo to show while storage is off', async () => {
    const { service } = build(stored(), new DisabledFileStorage() as never);
    expect(await service.get()).toEqual({ logo: null });
  });
});

describe('CompanyLogoService.set', () => {
  it('stores the picture, saves the row, logs it and removes the one it replaces', async () => {
    const { service, logos, storage, activity } = build(stored());
    await storage.put('logo/old/old.png', PNG, { contentType: 'image/png' });

    await service.set(upload(), actor);

    const saved = logos.save.mock.calls[0]![0];
    expect(saved).toMatchObject({
      fileName: 'logo.png',
      fileType: 'image/png',
      updatedByName: 'Asha',
    });
    expect(storage.objects.has(saved.fileKey)).toBe(true);
    expect(storage.objects.has('logo/old/old.png')).toBe(false);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LOGO_CHANGED', details: { fileName: 'logo.png' } }),
    );
  });

  it('refuses without storage, without a file and with the wrong kind of file', async () => {
    await expect(
      build(null, new DisabledFileStorage() as never).service.set(upload(), actor),
    ).rejects.toMatchObject({
      code: 'STORAGE_NOT_CONFIGURED',
    });
    await expect(build().service.set(undefined, actor)).rejects.toMatchObject({
      code: 'FILE_REQUIRED',
    });
    await expect(build().service.set(upload('logo.svg'), actor)).rejects.toMatchObject({
      code: 'FILE_TYPE_NOT_ALLOWED',
    });
  });

  it('keeps the old logo and removes the new picture when saving fails', async () => {
    const { service, logos, storage } = build(stored());
    await storage.put('logo/old/old.png', PNG, { contentType: 'image/png' });
    logos.save.mockRejectedValue(new Error('db down'));

    await expect(service.set(upload(), actor)).rejects.toThrow('db down');

    expect([...storage.objects.keys()]).toEqual(['logo/old/old.png']);
  });
});

describe('CompanyLogoService.remove', () => {
  it('removes the row and the picture, and logs it', async () => {
    const { service, logos, storage, activity } = build(stored());
    await storage.put('logo/old/old.png', PNG, { contentType: 'image/png' });

    await service.remove(actor);

    expect(logos.remove).toHaveBeenCalled();
    expect(storage.objects.size).toBe(0);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LOGO_REMOVED', details: { fileName: 'old.png' } }),
    );
  });

  it('is NOT_FOUND when there is no logo', async () => {
    await expect(build().service.remove(actor)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
