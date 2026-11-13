import type { MyWorkItem } from '@dpdp-kit/shared';

export const MY_WORK_TABS = ['all', 'breach', 'request', 'proof', 'approve', 'policies'] as const;
export type MyWorkTab = (typeof MY_WORK_TABS)[number];

/** The items on one tab. "Policies" covers the reviews and the drafts, which are both a policy to look after. */
export function onMyWorkTab(items: MyWorkItem[], tab: MyWorkTab): MyWorkItem[] {
  if (tab === 'all') return items;
  if (tab === 'policies') return items.filter((i) => i.kind === 'review' || i.kind === 'draft');
  return items.filter((item) => item.kind === tab);
}

const FOLDER: Record<MyWorkItem['kind'], string> = {
  breach: 'breaches',
  request: 'requests',
  proof: 'proof',
  approve: 'policies',
  review: 'policies',
  draft: 'policies',
};

/** Where something opens: a breach, a request, a proof requirement or a policy. */
export const workHref = (kind: MyWorkItem['kind'], id: string): string => `/${FOLDER[kind]}/${id}`;

export const myWorkHref = (item: MyWorkItem): string => workHref(item.kind, item.id);
