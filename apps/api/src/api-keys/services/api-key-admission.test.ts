import { describe, expect, it, vi } from 'vitest';
import type { ApiKeyRepository, KeyForSignIn } from '../repositories/api-key.repository';
import { generateKey } from '../utils/key-secret';
import { ApiKeyAdmission } from './api-key-admission';

const NOW = new Date('2026-11-12T10:00:00Z');

const found = (over: Partial<KeyForSignIn> = {}): KeyForSignIn => ({
  id: 'key-1',
  organizationId: 'org-1',
  role: 'member',
  expiresAt: null,
  revokedAt: null,
  lastUsedAt: null,
  createdBy: { id: 'u1', name: 'Alice', email: 'alice@example.test' },
  creatorRole: 'admin',
  ...over,
});

function build(row: KeyForSignIn | null) {
  const keys = {
    findForSignIn: vi.fn().mockResolvedValue(row),
    markUsed: vi.fn().mockResolvedValue(undefined),
  };
  return { admission: new ApiKeyAdmission(keys as unknown as ApiKeyRepository), keys };
}

describe('ApiKeyAdmission', () => {
  it('looks the key up by its hash, never by the key itself', async () => {
    const secret = generateKey();
    const { admission, keys } = build(found());
    await admission.admit(secret.key, NOW);
    expect(keys.findForSignIn).toHaveBeenCalledWith(secret.hash);
  });

  it('acts as the creator in the key organisation, with the key role', async () => {
    const { admission } = build(found());
    expect(await admission.admit('dpdp_x', NOW)).toEqual({
      user: { id: 'u1', name: 'Alice', email: 'alice@example.test' },
      organizationId: 'org-1',
      role: 'member',
    });
  });

  it('gives no more than the creator has now', async () => {
    const { admission } = build(found({ creatorRole: 'auditor' }));
    expect((await admission.admit('dpdp_x', NOW)).role).toBe('auditor');
  });

  it.each([
    ['unknown', null],
    ['revoked', found({ revokedAt: new Date('2026-11-01T00:00:00Z') })],
    ['expired', found({ expiresAt: new Date('2026-11-12T09:00:00Z') })],
    ['made by someone who has left', found({ creatorRole: null })],
  ])('refuses a key that is %s', async (_name, row) => {
    const { admission } = build(row);
    await expect(admission.admit('dpdp_x', NOW)).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });

  it('notes the use of a key that has not been used lately, and only then', async () => {
    const fresh = build(found({ lastUsedAt: new Date(NOW.getTime() - 5_000) }));
    await fresh.admission.admit('dpdp_x', NOW);
    expect(fresh.keys.markUsed).not.toHaveBeenCalled();

    const stale = build(found({ lastUsedAt: new Date(NOW.getTime() - 3_600_000) }));
    await stale.admission.admit('dpdp_x', NOW);
    expect(stale.keys.markUsed).toHaveBeenCalledWith('key-1', NOW);

    const never = build(found());
    await never.admission.admit('dpdp_x', NOW);
    expect(never.keys.markUsed).toHaveBeenCalled();
  });
});
