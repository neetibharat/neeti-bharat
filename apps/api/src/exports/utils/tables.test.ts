import { describe, expect, it } from 'vitest';
import { breachTable, evidenceTable, peopleTable, policyTable, requestTable } from './tables';

const day = (value: string) => new Date(`${value}T00:00:00Z`);

describe('breachTable', () => {
  const breach = {
    title: 'Lost laptop',
    description: 'd',
    foundAt: day('2026-11-01'),
    affectedSystems: 'HR laptop',
    affectedData: 'IDs',
    peopleAffected: 38,
    reportedByName: 'Ravi',
    assignee: null,
    steps: [
      { step: 'found', completedAt: day('2026-11-01'), note: null },
      { step: 'assess', completedAt: day('2026-11-02'), note: 'Not encrypted' },
    ],
  };

  it('has one row per breach, open until the close step exists, with the date of each step', () => {
    const { header, rows } = breachTable([breach] as never);
    const row = Object.fromEntries(header.map((name, i) => [name, rows[0]![i]]));
    expect(row).toMatchObject({
      Title: 'Lost laptop',
      'Assigned to': 'DPO',
      Status: 'Open',
      'Found on': '2026-11-01T00:00:00.000Z',
      'Assessed on': '2026-11-02T00:00:00.000Z',
      'Board told on': '',
      Notes: 'Assessed on: Not encrypted',
    });
  });

  it('is closed once the close step is done', () => {
    const closed = {
      ...breach,
      steps: [...breach.steps, { step: 'close', completedAt: day('2026-11-05'), note: null }],
    };
    const { header, rows } = breachTable([closed] as never);
    expect(rows[0]![header.indexOf('Status')]).toBe('Closed');
  });
});

describe('requestTable', () => {
  it('numbers the request, words its type and lists the systems with what was done', () => {
    const request = {
      number: 12,
      type: 'erasure',
      source: 'email',
      status: 'in_progress',
      personName: 'Rohan',
      personEmail: 'r@example.com',
      details: 'Delete me',
      receivedAt: day('2026-11-01'),
      dueAt: day('2026-12-01'),
      identityVerifiedAt: null,
      identityVerifiedByName: null,
      closedAt: null,
      closedByName: null,
      replyNote: null,
      assignee: { name: 'Priya' },
      loggedByName: 'Priya',
      tasks: [
        { system: 'Main database', outcome: 'erased', reason: null },
        { system: 'Invoicing', outcome: 'kept_by_law', reason: 'Tax records' },
      ],
    };
    const { header, rows } = requestTable([request] as never);
    const row = Object.fromEntries(header.map((name, i) => [name, rows[0]![i]]));
    expect(row).toMatchObject({
      Number: 'REQ-12',
      Type: 'Erasure',
      Status: 'In progress',
      'Assigned to': 'Priya',
      Systems: 'Main database: Erased | Invoicing: Kept by law (Tax records)',
    });
  });
});

describe('peopleTable', () => {
  const person = (over: object) => ({
    name: 'A',
    email: 'a@x.in',
    department: null,
    jobTitle: null,
    status: 'active',
    leftAt: null,
    roles: [{ role: 'SECURITY_LEAD' }],
    ...over,
  });

  it('shows the access of a signed-in account and "No login" for anyone else', () => {
    const people = [person({}), person({ email: 'b@x.in' }), person({ email: 'c@x.in' })];
    const accounts = [
      { email: 'a@x.in', role: 'admin', disabledAt: null },
      { email: 'c@x.in', role: 'member', disabledAt: day('2026-01-01') },
    ];
    const { header, rows } = peopleTable(people as never, accounts);
    const access = header.indexOf('Access');
    expect(rows.map((row) => row[access])).toEqual(['Admin', 'No login', 'No login']);
    expect(rows[0]![header.indexOf('Jobs held')]).toBe('Security lead');
  });
});

describe('evidenceTable and policyTable', () => {
  const evidence = [
    {
      id: 'e1',
      control: { id: 'DPDP-R6-01', title: 'Encryption' },
      proofRequirement: null,
      kind: 'file',
      title: 'scan',
      url: null,
      note: null,
      fileName: 'scan.pdf',
      fileSize: 9,
      fileType: 'application/pdf',
      fileSha256: 'abc',
      addedByName: 'Asha',
      createdAt: day('2026-11-02'),
    },
  ];

  it('leaves out the pack column on its own and adds it when paths are given', () => {
    expect(evidenceTable(evidence as never).header).not.toContain('File in pack');
    const withPaths = evidenceTable(evidence as never, new Map([['e1', 'proof/x/scan.pdf']]));
    expect(withPaths.rows[0]!.at(-1)).toBe('proof/x/scan.pdf');
    expect(withPaths.rows[0]![2]).toBe('General proof');
  });

  it('names the approver by person, or by title when none is chosen', () => {
    const base = {
      id: 'P01',
      title: 'T',
      status: 'approved',
      ownerRole: 'DPO',
      reviewEvery: 'annual',
      approvedAt: null,
      approvedByName: null,
      approvals: [{ version: 2 }],
      legalReferences: ['s8'],
      approverTitle: 'General Counsel',
    };
    const { rows } = policyTable([
      { ...base, approver: null },
      { ...base, approver: { name: 'Priya' } },
    ] as never);
    expect(rows.map((row) => row[4])).toEqual(['General Counsel', 'Priya']);
    expect(rows[0]![8]).toBe(2);
  });
});
