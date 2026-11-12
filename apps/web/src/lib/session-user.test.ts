import type { MeResponse } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { toSessionUser } from './session-user';

const me: MeResponse = {
  id: 'u1',
  name: 'Asha',
  email: 'asha@acme.in',
  organizations: [
    { id: 'a', name: 'Acme', role: 'admin', onboarded: true },
    { id: 'b', name: 'Beta', role: 'auditor', onboarded: true },
  ],
};

describe('toSessionUser', () => {
  it('takes the role from the organisation being worked in', () => {
    expect(toSessionUser(me, me.organizations[1]!).role).toBe('auditor');
    expect(toSessionUser(me, me.organizations[0]!).role).toBe('admin');
  });

  it('keeps every organisation for the switcher', () => {
    const user = toSessionUser(me, me.organizations[0]!);
    expect(user.organizations).toHaveLength(2);
    expect(user.organization.name).toBe('Acme');
  });
});
