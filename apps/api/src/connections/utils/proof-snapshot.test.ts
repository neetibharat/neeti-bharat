import type { ConnectionCheckResult } from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import { acceptanceKey, snapshotFor } from './proof-snapshot';

const azure = { name: 'Production', provider: 'azure' as const };
const at = new Date('2026-03-04T10:30:00Z');
const MFA = ['entra_mfa_registered', 'entra_mfa_enforced'] as const;

const pass = (id: ConnectionCheckResult['id']): ConnectionCheckResult => ({ id, status: 'pass' });
const allPass = MFA.map(pass);
const none = new Set<string>();

describe('snapshotFor', () => {
  it('gives a dated note when every check behind the proof passed', () => {
    const note = snapshotFor('PR-P04-01', azure, allPass, none, at);
    expect(note?.text).toContain('Production (Azure) on 2026-03-04 10:30 UTC');
    expect(note?.text).toContain('- entra_mfa_registered: passed');
    expect(note?.text).toContain('- entra_mfa_enforced: passed');
  });

  it('dates the note by the oldest reading behind it, when a check was carried over from an earlier run', () => {
    const results: ConnectionCheckResult[] = [
      pass('entra_mfa_registered'),
      { ...pass('entra_mfa_enforced'), checkedAt: '2026-03-01T08:15:00.000Z' },
    ];
    expect(snapshotFor('PR-P04-01', azure, results, none, at)?.text).toContain(
      'on 2026-03-01 08:15 UTC',
    );
  });

  it('gives nothing for a proof the system has no checks for, or one that is not listed', () => {
    expect(
      snapshotFor('PR-P05-01', { name: 'Code', provider: 'github' }, allPass, none, at),
    ).toBeNull();
    expect(snapshotFor('PR-P01-01', azure, allPass, none, at)).toBeNull();
  });

  it('gives nothing when a check failed, could not answer, or is missing from the run', () => {
    const failed: ConnectionCheckResult[] = [
      pass('entra_mfa_registered'),
      { id: 'entra_mfa_enforced', status: 'fail' },
    ];
    expect(snapshotFor('PR-P04-01', azure, failed, none, at)).toBeNull();
    const blind: ConnectionCheckResult[] = [
      pass('entra_mfa_registered'),
      { id: 'entra_mfa_enforced', status: 'skipped', reason: 'access' },
    ];
    expect(snapshotFor('PR-P04-01', azure, blind, none, at)).toBeNull();
    expect(snapshotFor('PR-P04-01', azure, [pass('entra_mfa_registered')], none, at)).toBeNull();
  });

  it('counts a check with nothing of its kind to look at as fine, but not as proof on its own', () => {
    const results: ConnectionCheckResult[] = [
      pass('entra_mfa_registered'),
      { id: 'entra_mfa_enforced', status: 'skipped', reason: 'none' },
    ];
    expect(snapshotFor('PR-P04-01', azure, results, none, at)).not.toBeNull();
    const nothing = MFA.map((id): ConnectionCheckResult => ({
      id,
      status: 'skipped',
      reason: 'none',
    }));
    expect(snapshotFor('PR-P04-01', azure, nothing, none, at)).toBeNull();
  });

  it('lets a person accept what a check flagged, resource by resource', () => {
    const flagged: ConnectionCheckResult[] = [
      pass('entra_mfa_registered'),
      {
        id: 'entra_mfa_enforced',
        status: 'warn',
        resources: [
          { name: 'a', status: 'warn' },
          { name: 'b', status: 'warn' },
        ],
      },
    ];
    const some = new Set([acceptanceKey('entra_mfa_enforced', 'a')]);
    expect(snapshotFor('PR-P04-01', azure, flagged, some, at)).toBeNull();
    const every = new Set([
      acceptanceKey('entra_mfa_enforced', 'a'),
      acceptanceKey('entra_mfa_enforced', 'b'),
    ]);
    expect(snapshotFor('PR-P04-01', azure, flagged, every, at)?.text).toContain(
      'entra_mfa_enforced: flagged, accepted by a person',
    );
  });

  it('accepts a check that names no resources only as a whole', () => {
    const flagged: ConnectionCheckResult[] = [
      pass('entra_mfa_registered'),
      { id: 'entra_mfa_enforced', status: 'fail' },
    ];
    expect(
      snapshotFor(
        'PR-P04-01',
        azure,
        flagged,
        new Set([acceptanceKey('entra_mfa_enforced', 'x')]),
        at,
      ),
    ).toBeNull();
    expect(
      snapshotFor(
        'PR-P04-01',
        azure,
        flagged,
        new Set([acceptanceKey('entra_mfa_enforced', '')]),
        at,
      ),
    ).not.toBeNull();
  });

  it('does not take a list that was cut short as everything accepted', () => {
    const cut: ConnectionCheckResult[] = [
      pass('entra_mfa_registered'),
      {
        id: 'entra_mfa_enforced',
        status: 'warn',
        values: { count: 300 },
        resources: [{ name: 'a', status: 'warn' }],
      },
    ];
    expect(
      snapshotFor('PR-P04-01', azure, cut, new Set([acceptanceKey('entra_mfa_enforced', 'a')]), at),
    ).toBeNull();
  });
});
