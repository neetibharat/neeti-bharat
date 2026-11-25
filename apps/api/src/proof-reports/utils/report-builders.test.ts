import { describe, expect, it } from 'vitest';
import {
  cloudReport,
  policyReport,
  trainingReport,
  websiteReport,
  type CloudRunInput,
} from './report-builders';
import { reportText } from './report-doc';

const now = new Date('2026-03-10T09:00:00Z');
const ranAt = new Date('2026-03-09T08:30:00Z');

const run = (overrides: Partial<CloudRunInput> = {}): CloudRunInput => ({
  connectionName: 'Production',
  provider: 'azure',
  ranAt,
  ranByName: 'Asha',
  bySchedule: false,
  results: [
    { id: 'entra_mfa_enforced', status: 'pass' },
    {
      id: 'sql_public_access',
      status: 'warn',
      resources: [
        { name: 'orders-db', status: 'warn' },
        { name: 'users-db', status: 'warn' },
      ],
    },
    { id: 'aks_rbac', status: 'skipped', reason: 'none' },
  ],
  accepted: [
    { checkId: 'sql_public_access', resourceName: 'orders-db', reason: 'Behind a firewall' },
  ],
  ...overrides,
});

describe('cloudReport', () => {
  it('has nothing to say when no account has been checked', () => {
    expect(cloudReport([], now)).toBeNull();
  });

  it('gives each account a section with every check, what was flagged and what was accepted', () => {
    const built = cloudReport([run()], now)!;
    expect(built.sourceAt).toEqual(ranAt);
    const section = built.doc.sections[0]!;
    expect(section.heading).toBe('Production (Azure)');
    expect(section.paragraphs![0]).toContain('1 passed, 1 need a look, 0 failed, 1 not checked');
    expect(section.table!.rows).toEqual([
      ['Entra mfa enforced', 'Passed', ''],
      ['Sql public access', 'Needs a look', 'orders-db (accepted: Behind a firewall), users-db'],
      ['Aks rbac', 'Not checked', 'Nothing of this kind was found to check.'],
    ]);
  });

  it('says the schedule did it when no person did', () => {
    const built = cloudReport([run({ bySchedule: true })], now)!;
    expect(built.doc.sections[0]!.paragraphs![0]).toContain('by the schedule');
  });

  it('takes the newest run as the time of the report', () => {
    const newer = new Date('2026-03-10T01:00:00Z');
    expect(cloudReport([run(), run({ ranAt: newer })], now)!.sourceAt).toEqual(newer);
  });
});

describe('websiteReport', () => {
  it('has nothing to say before a check has been run', () => {
    expect(websiteReport(null, now)).toBeNull();
  });

  it('lists every check with its numbers', () => {
    const built = websiteReport(
      {
        url: 'https://acme.in',
        checkedAt: ranAt,
        checkedByName: 'Asha',
        passed: 1,
        warned: 0,
        failed: 1,
        results: [
          { id: 'https', status: 'pass' },
          { id: 'privacy_notice', status: 'fail', values: { links: 0 } },
        ],
      },
      now,
    )!;
    expect(built.doc.subtitle).toContain('https://acme.in');
    expect(built.doc.sections[0]!.table!.rows[1]).toEqual(['Privacy notice', 'Failed', 'links: 0']);
  });
});

describe('trainingReport', () => {
  const data = {
    trainings: [{ name: 'Data handling', repeatsYearly: true }],
    people: [
      { personId: 'p1', name: 'Asha', email: 'a@x.in', done: 1, total: 1, completeOn: null },
      {
        personId: 'p2',
        name: 'Ravi',
        email: 'r@x.in',
        done: 0,
        total: 1,
        completeOn: '2026-04-01T00:00:00.000Z',
      },
    ],
    trained: 1,
    everyone: 2,
  };

  it('has nothing to say when there are no trainings', () => {
    expect(trainingReport({ ...data, trainings: [] }, now)).toBeNull();
  });

  it('says how many have done everything, and who has not, never quoting an email', () => {
    const built = trainingReport(data, now)!;
    expect(built.doc.sections[0]!.paragraphs![0]).toBe(
      '1 of 2 people have completed all 1 trainings in use.',
    );
    expect(built.doc.sections[2]!.table!.rows).toEqual([
      ['Asha', '1 of 1', 'Done'],
      ['Ravi', '0 of 1', '2026-04-01'],
    ]);
    expect(reportText(built.doc)).not.toContain('@');
  });
});

describe('policyReport', () => {
  const approved = new Date('2026-02-01T10:00:00Z');

  it('has nothing to say while no policy is approved', () => {
    const none = [{ title: 'Privacy', version: null, approvedAt: null, approvedByName: null }];
    expect(policyReport(none, now)).toBeNull();
  });

  it('lists each policy with its latest approval, and marks one never approved', () => {
    const built = policyReport(
      [
        { title: 'Privacy', version: 2, approvedAt: approved, approvedByName: 'Meera' },
        { title: 'Retention', version: null, approvedAt: null, approvedByName: null },
      ],
      now,
    )!;
    expect(built.sourceAt).toEqual(approved);
    expect(built.doc.sections[0]!.table!.rows).toEqual([
      ['Privacy', '2', '2026-02-01', 'Meera'],
      ['Retention', '', 'Not yet approved', ''],
    ]);
  });
});
