import type { MyWorkItem, MyWorkKind } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { myWorkHref, onMyWorkTab } from './my-work-tabs';

const item = (kind: MyWorkKind, id: string): MyWorkItem => ({
  kind,
  id,
  title: id,
  context: id,
  dueOn: null,
  overdue: false,
});

const items = [
  item('proof', 'a'),
  item('approve', 'P1'),
  item('review', 'P2'),
  item('draft', 'P3'),
];

describe('onMyWorkTab', () => {
  it('shows everything on All', () => {
    expect(onMyWorkTab(items, 'all')).toHaveLength(4);
  });

  it('groups reviews and drafts as policies', () => {
    expect(onMyWorkTab(items, 'policies').map((i) => i.id)).toEqual(['P2', 'P3']);
    expect(onMyWorkTab(items, 'proof').map((i) => i.id)).toEqual(['a']);
    expect(onMyWorkTab(items, 'approve').map((i) => i.id)).toEqual(['P1']);
  });
});

describe('myWorkHref', () => {
  it('opens proof on its own page and a policy on its page', () => {
    expect(myWorkHref(item('proof', 'a'))).toBe('/proof/a');
    expect(myWorkHref(item('draft', 'P3'))).toBe('/policies/P3');
  });
});
