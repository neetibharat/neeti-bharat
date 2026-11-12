import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import { currentOrganizationId, currentRole, withOrgStore } from '../../core/org/org-context';
import { NO_API_KEY_KEY, NO_ORGANIZATION_KEY, ROLES_KEY } from '../../core/org/roles.decorator';
import type { MembershipRepository } from '../repositories/membership.repository';
import { OrganizationGuard } from './organization.guard';

type Meta = { roles?: string[]; noOrganization?: boolean; noApiKey?: boolean };

function build(open: { organizationId: string; role: string }[], meta: Meta = {}) {
  const memberships = {
    findOpen: vi
      .fn()
      .mockResolvedValue(
        open.map((m) => ({ ...m, organizationName: m.organizationId.toUpperCase() })),
      ),
  } as unknown as MembershipRepository;
  const reflector = {
    getAllAndOverride: (key: string) =>
      key === ROLES_KEY
        ? meta.roles
        : key === NO_ORGANIZATION_KEY
          ? meta.noOrganization
          : key === NO_API_KEY_KEY
            ? meta.noApiKey
            : undefined,
  } as unknown as Reflector;
  const guard = new OrganizationGuard(reflector, memberships);
  const context = (request: object) =>
    ({
      getType: () => 'http',
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;
  return { guard, context, memberships };
}

const signedIn = (headers: Record<string, string> = {}) => ({
  headers,
  session: { user: { id: 'u1' } },
});

/** Runs the guard inside a request's place for an organisation, and reports what it set. */
async function run(guard: OrganizationGuard, context: ExecutionContext) {
  return withOrgStore(async () => {
    const allowed = await guard.canActivate(context);
    return { allowed, organizationId: currentOrganizationIdOrNone(), role: currentRole() };
  });
}

function currentOrganizationIdOrNone(): string | undefined {
  try {
    return currentOrganizationId();
  } catch {
    return undefined;
  }
}

describe('OrganizationGuard', () => {
  it('uses the only organisation a person has when the request does not name one', async () => {
    const { guard, context } = build([{ organizationId: 'o1', role: 'member' }]);
    expect(await run(guard, context(signedIn()))).toEqual({
      allowed: true,
      organizationId: 'o1',
      role: 'member',
    });
  });

  it('uses the organisation the request names, with the role the person has there', async () => {
    const { guard, context } = build([
      { organizationId: 'o1', role: 'member' },
      { organizationId: 'o2', role: 'admin' },
    ]);
    const outcome = await run(guard, context(signedIn({ 'x-organization-id': 'o2' })));
    expect(outcome).toMatchObject({ organizationId: 'o2', role: 'admin' });
  });

  it('asks which organisation when a person has several and the request names none', async () => {
    const { guard, context } = build([
      { organizationId: 'o1', role: 'member' },
      { organizationId: 'o2', role: 'admin' },
    ]);
    await expect(run(guard, context(signedIn()))).rejects.toMatchObject({
      code: 'ORGANIZATION_REQUIRED',
      status: 400,
    });
  });

  it('refuses an organisation the person does not belong to', async () => {
    const { guard, context } = build([{ organizationId: 'o1', role: 'admin' }]);
    await expect(
      run(guard, context(signedIn({ 'x-organization-id': 'o9' }))),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
  });

  it('refuses someone with no organisation at all', async () => {
    const { guard, context } = build([]);
    await expect(run(guard, context(signedIn()))).rejects.toMatchObject({
      code: 'ORGANIZATION_REQUIRED',
    });
  });

  it('checks the role they have in that organisation, not in another', async () => {
    const memberships = [
      { organizationId: 'o1', role: 'admin' },
      { organizationId: 'o2', role: 'auditor' },
    ];
    const { guard, context } = build(memberships, { roles: ['admin', 'member'] });
    expect((await run(guard, context(signedIn({ 'x-organization-id': 'o1' })))).allowed).toBe(true);
    await expect(
      run(guard, context(signedIn({ 'x-organization-id': 'o2' }))),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('leaves a route that is not about one organisation alone', async () => {
    const { guard, context, memberships } = build([], { noOrganization: true });
    expect(await run(guard, context(signedIn()))).toMatchObject({ allowed: true });
    expect(memberships.findOpen).not.toHaveBeenCalled();
  });

  it('lets a public route through when nobody is signed in', async () => {
    const { guard, context } = build([]);
    expect((await run(guard, context({ headers: {}, session: null }))).allowed).toBe(true);
  });

  describe('for a request that came with an API key', () => {
    const withKey = (role: string, headers: Record<string, string> = {}) => ({
      headers,
      session: { user: { id: 'u1' } },
      keyAccess: { organizationId: 'o1', role },
    });

    it('works in the key organisation with the key role, without looking up memberships', async () => {
      const { guard, context, memberships } = build([]);
      expect(await run(guard, context(withKey('member')))).toEqual({
        allowed: true,
        organizationId: 'o1',
        role: 'member',
      });
      expect(memberships.findOpen).not.toHaveBeenCalled();
    });

    it('ignores an organisation named in the header', async () => {
      const { guard, context } = build([]);
      const outcome = await run(guard, context(withKey('member', { 'x-organization-id': 'o2' })));
      expect(outcome.organizationId).toBe('o1');
    });

    it('refuses a route that needs a role the key does not have', async () => {
      const { guard, context } = build([], { roles: ['admin'] });
      await expect(run(guard, context(withKey('member')))).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });

    it('refuses a route that is for people only, even with an admin key, but not a person', async () => {
      const { guard, context } = build([{ organizationId: 'o1', role: 'admin' }], {
        noApiKey: true,
      });
      await expect(run(guard, context(withKey('admin')))).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
      expect((await run(guard, context(signedIn()))).allowed).toBe(true);
    });

    it('refuses a route that is not about one organisation', async () => {
      const { guard, context } = build([], { noOrganization: true });
      await expect(run(guard, context(withKey('member')))).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });
  });

  it('refuses to run before the sign-in guard has', async () => {
    const { guard, context } = build([]);
    await expect(run(guard, context({ headers: {} }))).rejects.toThrow(/before the sign-in guard/);
  });
});
