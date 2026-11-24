import {
  CONNECTION_NAMES_SHOWN,
  type ConnectionCheckResult,
  type ConnectionProvider,
  type FlaggedResource,
  type TeamTrainingRow,
} from '@dpdp-kit/shared';
import { dateOf, dateTimeOf, humanize, type ReportDoc } from './report-doc';

/** A report, and when the newest thing it reports on happened, to tell whether it says anything new. */
export interface Built {
  doc: ReportDoc;
  sourceAt: Date;
}

const SYSTEM: Record<ConnectionProvider, string> = { azure: 'Azure', github: 'GitHub' };
const STATUS: Record<ConnectionCheckResult['status'], string> = {
  pass: 'Passed',
  warn: 'Needs a look',
  fail: 'Failed',
  skipped: 'Not checked',
};
const SKIPPED: Record<string, string> = {
  none: 'Nothing of this kind was found to check.',
  access: 'The connection is not allowed to read it.',
  error: 'The check did not finish.',
};

export interface CloudRunInput {
  connectionName: string;
  provider: ConnectionProvider;
  ranAt: Date;
  ranByName: string;
  bySchedule: boolean;
  results: ConnectionCheckResult[];
  accepted: { checkId: string; resourceName: string; reason: string }[];
}

type Accepted = CloudRunInput['accepted'];

/** The settings a check saw on a resource, as `(minimalTlsVersion: 1.0)`, so the report says why it did not pass. */
function foundOf({ found }: FlaggedResource): string {
  const pairs = Object.entries(found ?? {}).map(([key, value]) => `${key}: ${value ?? 'not set'}`);
  return pairs.length > 0 ? ` (${pairs.join(', ')})` : '';
}

function flaggedDetail(result: ConnectionCheckResult, accepted: Accepted): string {
  const whole = accepted.find((a) => a.checkId === result.id && a.resourceName === '');
  if (whole) return `Accepted by a person: ${whole.reason}`;
  const resources = result.resources ?? [];
  const named = resources.slice(0, CONNECTION_NAMES_SHOWN).map((resource) => {
    const own = accepted.find((a) => a.checkId === result.id && a.resourceName === resource.name);
    return own
      ? `${resource.name} (accepted: ${own.reason})`
      : `${resource.name}${foundOf(resource)}`;
  });
  const more = resources.length - named.length;
  return more > 0 ? `${named.join(', ')} and ${more} more` : named.join(', ');
}

function outcomeDetail(result: ConnectionCheckResult, accepted: Accepted): string {
  if (result.status === 'skipped') return SKIPPED[result.reason ?? 'none'] ?? '';
  return result.status === 'pass' ? '' : flaggedDetail(result, accepted);
}

/** A result carried over from an earlier run says when it was read. */
function cloudDetail(result: ConnectionCheckResult, accepted: Accepted): string {
  const detail = outcomeDetail(result, accepted);
  if (!result.checkedAt) return detail;
  const read = `Read ${dateTimeOf(new Date(result.checkedAt))}.`;
  return detail ? `${read} ${detail}` : read;
}

/** The latest run of each connected account, with every check and what it found. Nothing when no account is connected. */
export function cloudReport(runs: CloudRunInput[], now: Date): Built | null {
  if (runs.length === 0) return null;
  const sections = runs.map((run) => {
    const counts = (status: ConnectionCheckResult['status']) =>
      run.results.filter((r) => r.status === status).length;
    const by = run.bySchedule ? 'the schedule' : run.ranByName;
    return {
      heading: `${run.connectionName} (${SYSTEM[run.provider]})`,
      paragraphs: [
        `Checked ${dateTimeOf(run.ranAt)} by ${by}: ${counts('pass')} passed, ${counts('warn')} need a look, ${counts('fail')} failed, ${counts('skipped')} not checked.`,
      ],
      table: {
        head: ['Check', 'Result', 'Detail'],
        rows: run.results.map((r) => [
          humanize(r.id),
          STATUS[r.status],
          cloudDetail(r, run.accepted),
        ]),
      },
    };
  });
  const doc: ReportDoc = {
    title: 'Cloud configuration check report',
    subtitle: `The latest read-only check of each connected account, as of ${dateOf(now)}.`,
    sections,
  };
  return { doc, sourceAt: new Date(Math.max(...runs.map((run) => run.ranAt.getTime()))) };
}

export interface WebsiteInput {
  url: string;
  checkedAt: Date;
  checkedByName: string;
  passed: number;
  warned: number;
  failed: number;
  results: {
    id: string;
    status: 'pass' | 'warn' | 'fail';
    values?: Record<string, string | number>;
  }[];
}

const valuesText = (values: Record<string, string | number> | undefined): string =>
  Object.entries(values ?? {})
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')
    .slice(0, 160);

/** The latest check of the company's public website. Nothing when none has been run. */
export function websiteReport(check: WebsiteInput | null, now: Date): Built | null {
  if (!check) return null;
  const doc: ReportDoc = {
    title: 'Website check report',
    subtitle: `What the public pages of ${check.url} show, as of ${dateOf(now)}.`,
    sections: [
      {
        heading: 'Latest check',
        paragraphs: [
          `Checked ${dateTimeOf(check.checkedAt)} by ${check.checkedByName}: ${check.passed} passed, ${check.warned} need a look, ${check.failed} failed.`,
        ],
        table: {
          head: ['Check', 'Result', 'Detail'],
          rows: check.results.map((r) => [humanize(r.id), STATUS[r.status], valuesText(r.values)]),
        },
      },
    ],
  };
  return { doc, sourceAt: check.checkedAt };
}

export interface TrainingInput {
  trainings: { name: string; repeatsYearly: boolean }[];
  people: TeamTrainingRow[];
  trained: number;
  everyone: number;
}

/** How far each person has got with the trainings in use. Nothing when the company has none. */
export function trainingReport(data: TrainingInput, now: Date): Built | null {
  if (data.trainings.length === 0) return null;
  const doc: ReportDoc = {
    title: 'Security awareness training report',
    subtitle: `Who has completed the trainings in use, as of ${dateOf(now)}.`,
    sections: [
      {
        heading: 'Summary',
        paragraphs: [
          `${data.trained} of ${data.everyone} people have completed all ${data.trainings.length} trainings in use.`,
        ],
      },
      {
        heading: 'Trainings in use',
        table: {
          head: ['Training', 'Repeats'],
          rows: data.trainings.map((t) => [t.name, t.repeatsYearly ? 'Every year' : 'Once']),
        },
      },
      {
        heading: 'People',
        table: {
          head: ['Person', 'Completed', 'Complete by'],
          rows: data.people.map((p) => [
            p.name,
            `${p.done} of ${p.total}`,
            p.done === p.total ? 'Done' : (p.completeOn?.slice(0, 10) ?? ''),
          ]),
        },
      },
    ],
  };
  return { doc, sourceAt: now };
}

export interface PolicyInput {
  title: string;
  version: number | null;
  approvedAt: Date | null;
  approvedByName: string | null;
}

/** Every policy with its latest approval. Nothing when none has been approved. */
export function policyReport(policies: PolicyInput[], now: Date): Built | null {
  const approved = policies.filter((p) => p.approvedAt);
  if (approved.length === 0) return null;
  const doc: ReportDoc = {
    title: 'Policy approval records',
    subtitle: `The latest approval of each policy, as of ${dateOf(now)}. ${approved.length} of ${policies.length} policies have been approved.`,
    sections: [
      {
        heading: 'Policies',
        table: {
          head: ['Policy', 'Version', 'Approved', 'By'],
          rows: policies.map((p) => [
            p.title,
            p.version ? String(p.version) : '',
            p.approvedAt ? dateOf(p.approvedAt) : 'Not yet approved',
            p.approvedByName ?? '',
          ]),
        },
      },
    ],
  };
  const newest = Math.max(...approved.map((p) => p.approvedAt!.getTime()));
  return { doc, sourceAt: new Date(newest) };
}
