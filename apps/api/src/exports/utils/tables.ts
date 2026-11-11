import {
  BREACH_STEPS,
  requestRef,
  type BreachStep,
  type ChecklistResponse,
} from '@dpdp-kit/shared';
import type { ExportRepository } from '../repositories/export.repository';
import type { Cell } from './csv';

export interface Table {
  header: string[];
  rows: Cell[][];
}

type Rows<K extends keyof ExportRepository> = Awaited<ReturnType<ExportRepository[K]>>;

const iso = (date: Date | null | undefined): string => (date ? date.toISOString() : '');
const words = (code: string): string => {
  const text = code.replaceAll('_', ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const STEP_COLUMNS: Record<BreachStep, string> = {
  found: 'Found on',
  assess: 'Assessed on',
  tell_board: 'Board told on',
  tell_people: 'People told on',
  close: 'Closed on',
};

export function breachTable(breaches: Rows<'breaches'>): Table {
  const header = [
    'Title',
    'Description',
    'Found',
    'Systems affected',
    'Data affected',
    'People affected',
    'Reported by',
    'Assigned to',
    'Status',
    ...BREACH_STEPS.map((step) => STEP_COLUMNS[step]),
    'Notes',
  ];
  const rows = breaches.map((breach) => {
    const doneAt = (step: BreachStep) => breach.steps.find((row) => row.step === step)?.completedAt;
    const notes = breach.steps
      .filter((row) => row.note)
      .map((row) => `${STEP_COLUMNS[row.step]}: ${row.note}`);
    return [
      breach.title,
      breach.description,
      iso(breach.foundAt),
      breach.affectedSystems,
      breach.affectedData,
      breach.peopleAffected,
      breach.reportedByName,
      breach.assignee?.name ?? 'DPO',
      doneAt('close') ? 'Closed' : 'Open',
      ...BREACH_STEPS.map((step) => iso(doneAt(step))),
      notes.join(' | '),
    ];
  });
  return { header, rows };
}

const taskText = (task: Rows<'requests'>[number]['tasks'][number]): string =>
  `${task.system}: ${words(task.outcome)}${task.reason ? ` (${task.reason})` : ''}`;

const REQUEST_COLUMNS = [
  'Number',
  'Type',
  'Source',
  'Status',
  'Person',
  'Email',
  'Details',
  'Received',
  'Due',
  'Identity checked on',
  'Identity checked by',
  'Closed on',
  'Closed by',
  'Reply',
  'Assigned to',
  'Systems',
  'Logged by',
];

export function requestTable(requests: Rows<'requests'>): Table {
  const rows = requests.map((request) => [
    requestRef(request.number),
    words(request.type),
    words(request.source),
    words(request.status),
    request.personName,
    request.personEmail,
    request.details,
    iso(request.receivedAt),
    iso(request.dueAt),
    iso(request.identityVerifiedAt),
    request.identityVerifiedByName,
    iso(request.closedAt),
    request.closedByName,
    request.replyNote,
    request.assignee?.name ?? 'DPO',
    request.tasks.map(taskText).join(' | '),
    request.loggedByName,
  ]);
  return { header: REQUEST_COLUMNS, rows };
}

export interface Account {
  email: string;
  role: string;
  disabledAt: Date | null;
}

export function peopleTable(people: Rows<'people'>, accounts: Account[]): Table {
  const header = [
    'Name',
    'Email',
    'Department',
    'Job title',
    'Status',
    'Left on',
    'Jobs held',
    'Access',
  ];
  const access = new Map(accounts.filter((a) => !a.disabledAt).map((a) => [a.email, a.role]));
  const rows = people.map((person) => [
    person.name,
    person.email,
    person.department,
    person.jobTitle,
    words(person.status),
    iso(person.leftAt),
    person.roles.map((held) => words(held.role)).join('; '),
    words(access.get(person.email) ?? 'no login'),
  ]);
  return { header, rows };
}

/** Where each uploaded file sits in the audit pack, by proof id. Without it the column is left out. */
export type PackPaths = ReadonlyMap<string, string>;

export function evidenceTable(evidence: Rows<'evidence'>, paths?: PackPaths): Table {
  const header = [
    'Control id',
    'Control',
    'Requirement',
    'Kind',
    'Title',
    'Link',
    'Note',
    'File name',
    'File size (bytes)',
    'File type',
    'SHA-256',
    'Added by',
    'Added on',
    ...(paths ? ['File in pack'] : []),
  ];
  const rows = evidence.map((item) => [
    item.control.id,
    item.control.title,
    item.proofRequirement?.title ?? 'General proof',
    words(item.kind),
    item.title,
    item.url,
    item.note,
    item.fileName,
    item.fileSize,
    item.fileType,
    item.fileSha256,
    item.addedByName,
    iso(item.createdAt),
    ...(paths ? [paths.get(item.id) ?? ''] : []),
  ]);
  return { header, rows };
}

export function proofRequirementTable(requirements: Rows<'proofRequirements'>): Table {
  const header = [
    'Control id',
    'Control',
    'Requirement',
    'How often',
    'Assigned to',
    'Due',
    'Pieces of proof',
    'Last proof on',
  ];
  const rows = requirements.map((requirement) => {
    const latest = requirement.evidence.map((e) => e.createdAt.getTime()).sort((a, b) => b - a)[0];
    return [
      requirement.control.id,
      requirement.control.title,
      requirement.title,
      words(requirement.frequency),
      requirement.assignee?.name ?? 'Control owner',
      iso(requirement.dueDate),
      requirement.evidence.length,
      latest === undefined ? '' : iso(new Date(latest)),
    ];
  });
  return { header, rows };
}

export function policyTable(policies: Rows<'policies'>, paths?: PackPaths): Table {
  const header = [
    'Id',
    'Title',
    'Status',
    'Owner',
    'Approver',
    'Reviewed',
    'Approved on',
    'Approved by',
    'Approved version',
    'Legal references',
    ...(paths ? ['Text in pack'] : []),
  ];
  const rows = policies.map((policy) => [
    policy.id,
    policy.title,
    words(policy.status),
    words(policy.ownerRole),
    policy.approver?.name ?? policy.approverTitle,
    policy.reviewEvery,
    iso(policy.approvedAt),
    policy.approvedByName,
    policy.approvals[0]?.version,
    policy.legalReferences.join('; '),
    ...(paths ? [paths.get(policy.id) ?? ''] : []),
  ]);
  return { header, rows };
}

export function activityTable(events: Rows<'activityAfter'>): Table {
  const header = [
    'Position',
    'When',
    'Who',
    'Action',
    'Subject',
    'Details',
    'Hash',
    'Previous hash',
  ];
  const rows = events.map((event) => [
    String(event.seq),
    iso(event.occurredAt),
    event.actorLabel,
    event.action,
    [event.subjectType, event.subjectId].filter(Boolean).join(' '),
    event.details === null ? '' : JSON.stringify(event.details),
    event.hash,
    event.prevHash,
  ]);
  return { header, rows };
}

export function checklistTable(checklists: ChecklistResponse[]): Table {
  const header = [
    'Framework',
    'Rule',
    'Rule title',
    'Applies',
    'Control id',
    'Control',
    'Status',
    'Owner',
    'Owner now',
    'Assigned to',
    'Review date',
    'Policies approved',
    'Proof provided',
    'Pieces of proof',
  ];
  const rows = checklists.flatMap((checklist) =>
    checklist.rules.flatMap((rule) =>
      rule.controls.map((control) => [
        checklist.framework.name,
        rule.reference,
        rule.title,
        rule.applies ? 'Yes' : 'No',
        control.id,
        control.title,
        words(control.status),
        words(control.ownerRole),
        control.ownerName,
        control.assignee?.name,
        control.reviewDate,
        `${control.policiesApproved} of ${control.policiesTotal}`,
        `${control.proofProvided} of ${control.proofRequired}`,
        control.evidenceCount,
      ]),
    ),
  );
  return { header, rows };
}
