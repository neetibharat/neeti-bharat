import type { OrganizationSummary } from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import { resolveActiveOrganization } from './active-organization';

const a: OrganizationSummary = { id: 'a', name: 'Acme', role: 'admin', onboarded: true };
const b: OrganizationSummary = { id: 'b', name: 'Beta', role: 'auditor', onboarded: true };

describe('resolveActiveOrganization', () => {
  it('uses the one remembered when the person still belongs to it', () => {
    expect(resolveActiveOrganization([a, b], 'b')).toBe(b);
  });

  it('falls back to the first when the remembered one is gone or was never set', () => {
    expect(resolveActiveOrganization([a, b], 'gone')).toBe(a);
    expect(resolveActiveOrganization([a, b], undefined)).toBe(a);
    expect(resolveActiveOrganization([a, b], null)).toBe(a);
  });

  it('is null for someone who belongs to none', () => {
    expect(resolveActiveOrganization([], 'a')).toBeNull();
  });
});
