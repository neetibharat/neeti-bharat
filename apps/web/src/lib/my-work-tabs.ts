import type { MyWorkItem } from '@dpdp-kit/shared';

export const MY_WORK_TABS = ['all', 'proof', 'approve', 'policies'] as const;
export type MyWorkTab = (typeof MY_WORK_TABS)[number];

/** The items on one tab. "Policies" covers the reviews and the drafts, which are both a policy to look after. */
export function onMyWorkTab(items: MyWorkItem[], tab: MyWorkTab): MyWorkItem[] {
  if (tab === 'all') return items;
  if (tab === 'policies') return items.filter((i) => i.kind === 'review' || i.kind === 'draft');
  return items.filter((item) => item.kind === tab);
}

/** Where an item opens: a proof requirement or a policy. */
export const myWorkHref = (item: MyWorkItem): string =>
  item.kind === 'proof' ? `/proof/${item.id}` : `/policies/${item.id}`;
