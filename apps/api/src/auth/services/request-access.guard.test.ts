import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import type { ApiKeyAdmission } from '../../api-keys/services/api-key-admission';
import type { OrganizationGuard } from '../../organizations/services/organization.guard';
import type { Auth } from '../auth.factory';
import { RequestAccessGuard } from './request-access.guard';

const withHeaders = (headers: Record<string, string>, request: object = {}) =>
  ({
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => Object.assign(request, { headers }) }),
  }) as unknown as ExecutionContext;

const context = withHeaders({});

/** A guard whose two checks write to one list, so the order they ran in can be read back. */
function build(signedIn: () => Promise<boolean>, admit = vi.fn()) {
  const calls: string[] = [];
  const organization = {
    canActivate: vi.fn(() => {
      calls.push('organization');
      return Promise.resolve(true);
    }),
  } as unknown as OrganizationGuard;
  const guard = new RequestAccessGuard({} as Reflector, {} as Auth, organization, {
    admit,
  } as unknown as ApiKeyAdmission);
  // The library's guard is made inside the constructor; it is swapped for one that records and answers as told.
  (guard as unknown as { signedIn: unknown }).signedIn = {
    canActivate: async () => {
      calls.push('signed-in');
      return signedIn();
    },
  };
  return { guard, organization, calls, admit };
}

describe('RequestAccessGuard', () => {
  it('checks sign-in first and the organisation second', async () => {
    const { guard, calls } = build(async () => true);
    expect(await guard.canActivate(context)).toBe(true);
    expect(calls).toEqual(['signed-in', 'organization']);
  });

  it('stops when sign-in refuses, without asking about the organisation', async () => {
    const { guard, organization } = build(async () => false);
    expect(await guard.canActivate(context)).toBe(false);
    expect(organization.canActivate).not.toHaveBeenCalled();
  });

  it('stops when sign-in fails, without asking about the organisation', async () => {
    const { guard, organization } = build(async () => {
      throw new Error('UNAUTHENTICATED');
    });
    await expect(guard.canActivate(context)).rejects.toThrow('UNAUTHENTICATED');
    expect(organization.canActivate).not.toHaveBeenCalled();
  });

  describe('with an API key', () => {
    const access = {
      user: { id: 'u1', name: 'Alice', email: 'alice@example.test' },
      organizationId: 'org-1',
      role: 'member',
    };

    it('signs the request in as the key creator, without the sign-in library', async () => {
      const { guard, calls, admit } = build(async () => true, vi.fn().mockResolvedValue(access));
      const request: Record<string, unknown> = {};
      expect(await guard.canActivate(withHeaders({ 'x-api-key': 'dpdp_abc' }, request))).toBe(true);
      expect(admit).toHaveBeenCalledWith('dpdp_abc');
      expect(calls).toEqual(['organization']);
      expect(request.session).toMatchObject({ user: access.user });
      expect(request.keyAccess).toEqual({ organizationId: 'org-1', role: 'member' });
    });

    it('stops on a key that is not accepted, without asking about the organisation', async () => {
      const { guard, organization } = build(
        async () => true,
        vi.fn().mockRejectedValue(new Error('UNAUTHENTICATED')),
      );
      await expect(guard.canActivate(withHeaders({ 'x-api-key': 'dpdp_bad' }))).rejects.toThrow(
        'UNAUTHENTICATED',
      );
      expect(organization.canActivate).not.toHaveBeenCalled();
    });
  });
});
