import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import type { OrganizationGuard } from '../../organizations/services/organization.guard';
import type { Auth } from '../auth.factory';
import { RequestAccessGuard } from './request-access.guard';

const context = {} as ExecutionContext;

/** A guard whose two checks write to one list, so the order they ran in can be read back. */
function build(signedIn: () => Promise<boolean>) {
  const calls: string[] = [];
  const organization = {
    canActivate: vi.fn(() => {
      calls.push('organization');
      return Promise.resolve(true);
    }),
  } as unknown as OrganizationGuard;
  const guard = new RequestAccessGuard({} as Reflector, {} as Auth, organization);
  // The library's guard is made inside the constructor; it is swapped for one that records and answers as told.
  (guard as unknown as { signedIn: unknown }).signedIn = {
    canActivate: async () => {
      calls.push('signed-in');
      return signedIn();
    },
  };
  return { guard, organization, calls };
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
});
