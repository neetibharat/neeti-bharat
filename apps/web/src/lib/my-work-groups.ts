import type { MyWorkItem } from '@neeti-bharat/shared';

export const MY_WORK_GROUPS = ['overdue', 'week', 'later', 'undated'] as const;
export type MyWorkGroupId = (typeof MY_WORK_GROUPS)[number];

export interface MyWorkGroup {
  id: MyWorkGroupId;
  items: MyWorkItem[];
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function groupOf(item: MyWorkItem, now: Date): MyWorkGroupId {
  if (item.overdue) return 'overdue';
  if (!item.dueOn) return 'undated';
  return new Date(item.dueOn).getTime() - now.getTime() <= WEEK_MS ? 'week' : 'later';
}

/** Items sorted into overdue, due this week, due later and no date, keeping their order. Empty groups are left out. */
export function groupMyWork(items: MyWorkItem[], now: Date): MyWorkGroup[] {
  return MY_WORK_GROUPS.map((id) => ({
    id,
    items: items.filter((item) => groupOf(item, now) === id),
  })).filter((group) => group.items.length > 0);
}
