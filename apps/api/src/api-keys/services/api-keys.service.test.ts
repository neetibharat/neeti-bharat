import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import type { ApiKey } from '../../generated/prisma/client';
import type { ApiKeyRepository } from '../repositories/api-key.repository';
import { ApiKeysService } from './api-keys.service';

const actor = { id: 'u1', label: 'Alice' };

const row = (over: Partial<ApiKey> = {}): ApiKey => ({
  id: 'key-1',
  organizationId: 'org-1',
  name: 'Claude Code',
  role: 'member',
  prefix: 'dpdp_ab12cd',
  keyHash: 'hash',
  createdById: 'u1',
  createdByName: 'Alice',
  createdAt: new Date('2026-11-12T10:00:00Z'),
  expiresAt: null,
  lastUsedAt: null,
  revokedAt: null,
  ...over,
});

function build(existing: ApiKey | null = row(), active = 0) {
  const keys = {
    create: vi.fn().mockImplementation((data) => Promise.resolve(row(data))),
    countActive: vi.fn().mockResolvedValue(active),
    findById: vi.fn().mockResolvedValue(existing),
    revoke: vi.fn().mockResolvedValue(undefined),
    list: vi.fn(),
  };
  const activity = { record: vi.fn().mockResolvedValue(undefined) };
  const service = new ApiKeysService(
    keys as unknown as ApiKeyRepository,
    activity as unknown as ActivityService,
  );
  return { service, keys, activity };
}

describe('ApiKeysService.create', () => {
  it('returns the whole key once, and stores only its hash and start', async () => {
    const { service, keys } = build();
    const made = await service.create({ name: 'Claude Code', role: 'member' }, actor);
    expect(made.key).toMatch(/^dpdp_[0-9a-f]{64}$/);
    const stored = keys.create.mock.calls[0]![0] as Record<string, unknown>;
    expect(JSON.stringify(stored)).not.toContain(made.key);
    expect(stored).toMatchObject({ createdById: 'u1', createdByName: 'Alice', expiresAt: null });
  });

  it('sets an expiry when a lifetime is given', async () => {
    const { service, keys } = build();
    await service.create({ name: 'CI', role: 'auditor', expiresInDays: 30 }, actor);
    const stored = keys.create.mock.calls[0]![0] as { expiresAt: Date };
    const days = (stored.expiresAt.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThan(30.1);
  });

  it('records who made it, without the key', async () => {
    const { service, activity } = build();
    await service.create({ name: 'Claude Code', role: 'member' }, actor);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        action: 'API_KEY_CREATED',
        details: { name: 'Claude Code', role: 'member' },
      }),
    );
  });

  it('refuses another key when the organisation is at its limit', async () => {
    const { service, keys } = build(row(), 25);
    await expect(service.create({ name: 'One more', role: 'member' }, actor)).rejects.toMatchObject(
      { code: 'API_KEY_LIMIT', params: { limit: 25 } },
    );
    expect(keys.create).not.toHaveBeenCalled();
  });
});

describe('ApiKeysService.revoke', () => {
  it('revokes the key and records it', async () => {
    const { service, keys, activity } = build();
    await service.revoke('key-1', actor);
    expect(keys.revoke).toHaveBeenCalledWith('key-1', expect.any(Date));
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'API_KEY_REVOKED', details: { name: 'Claude Code' } }),
    );
  });

  it('does nothing, and records nothing, for a key already revoked', async () => {
    const { service, keys, activity } = build(row({ revokedAt: new Date() }));
    await service.revoke('key-1', actor);
    expect(keys.revoke).not.toHaveBeenCalled();
    expect(activity.record).not.toHaveBeenCalled();
  });

  it('says not found for a key that is not in this organisation', async () => {
    const { service } = build(null);
    await expect(service.revoke('other', actor)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
