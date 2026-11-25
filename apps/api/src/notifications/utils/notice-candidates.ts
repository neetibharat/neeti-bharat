import {
  NOTIFICATION_DUE_SOON_DAYS,
  type MyWorkItem,
  type NotificationKind,
  type NotificationState,
} from '@dpdp-kit/shared';

/** A notice that should exist for someone, before it is checked against the ones already made. */
export interface NoticeCandidate {
  kind: NotificationKind;
  state: NotificationState;
  subjectId: string;
  title: string;
  dueOn: string;
  /** The same for the same thing in the same state with the same date, so it is made once. A new due date makes a new notice. */
  dedupeKey: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DATED_KINDS: readonly string[] = [
  'breach',
  'request',
  'proof',
  'review',
  'vendor',
  'training',
];

function stateOf(item: MyWorkItem & { dueOn: string }, now: Date): NotificationState | null {
  if (item.overdue) return 'overdue';
  const days = (Date.parse(item.dueOn) - now.getTime()) / DAY_MS;
  return days <= NOTIFICATION_DUE_SOON_DAYS ? 'due_soon' : null;
}

/** The notices someone's work calls for: dated work that is overdue or due within a few days. */
export function noticeCandidates(items: readonly MyWorkItem[], now: Date): NoticeCandidate[] {
  return items.flatMap((item) => {
    if (!item.dueOn || !DATED_KINDS.includes(item.kind)) return [];
    const state = stateOf({ ...item, dueOn: item.dueOn }, now);
    if (!state) return [];
    const kind = item.kind as NotificationKind;
    return [
      {
        kind,
        state,
        subjectId: item.id,
        title: item.title,
        dueOn: item.dueOn,
        dedupeKey: `${kind}:${state}:${item.id}:${item.dueOn}`,
      },
    ];
  });
}

/** Notices are made once a day, from this hour in India, so a deadline notice arrives at the start of the working day. */
export const NOTICE_HOUR_IST = 9;

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Whether it is time, in India, for the day's notices. */
export function isNoticeTime(now: Date): boolean {
  return new Date(now.getTime() + IST_OFFSET_MS).getUTCHours() >= NOTICE_HOUR_IST;
}
