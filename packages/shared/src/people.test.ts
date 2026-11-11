import { describe, expect, it } from 'vitest';
import { JOB_ROLES } from './people.js';
import { ACCESS_LEVELS, APP_ROLES } from './roles.js';

describe('roles', () => {
  it('has the three login roles, and staff as the level with no login', () => {
    expect(APP_ROLES).toEqual(['admin', 'member', 'auditor']);
    expect(ACCESS_LEVELS).toEqual(['admin', 'member', 'auditor', 'staff']);
  });

  it('has the nine job roles once each', () => {
    expect(JOB_ROLES).toHaveLength(9);
    expect(new Set(JOB_ROLES).size).toBe(9);
  });
});
