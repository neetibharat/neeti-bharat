import type { MyWorkItem } from '@neeti-bharat/shared';

export const MY_WORK_TABS = [
  'all',
  'breach',
  'request',
  'proof',
  'approve',
  'policies',
  'vendor',
  'training',
] as const;
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
  vendor: 'vendors',
  training: 'training',
};

/** Where something opens: a breach, a request, a proof requirement, a policy or a vendor. */
export const workHref = (kind: MyWorkItem['kind'], id: string): string =>
  kind === 'training' ? '/training' : `/${FOLDER[kind]}/${id}`;

export const myWorkHref = (item: MyWorkItem): string => workHref(item.kind, item.id);
