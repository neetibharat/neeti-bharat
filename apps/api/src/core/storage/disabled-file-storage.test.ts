import { describe, expect, it } from 'vitest';
import { DisabledFileStorage } from './disabled-file-storage';

describe('DisabledFileStorage', () => {
  const storage = new DisabledFileStorage();

  it('reports that storage is off', () => {
    expect(storage.isEnabled()).toBe(false);
  });

  it('refuses every call with STORAGE_NOT_CONFIGURED and a 503', async () => {
    const calls = [storage.put(), storage.read(), storage.signedDownloadUrl(), storage.remove()];
    for (const call of calls) {
      await expect(call).rejects.toMatchObject({ code: 'STORAGE_NOT_CONFIGURED', status: 503 });
    }
  });
});
