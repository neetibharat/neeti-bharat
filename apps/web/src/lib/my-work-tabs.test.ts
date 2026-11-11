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
  item('breach', 'b'),
  item('request', 'r'),
  item('proof', 'a'),
  item('approve', 'P1'),
  item('review', 'P2'),
  item('draft', 'P3'),
];

describe('onMyWorkTab', () => {
  it('shows everything on All', () => {
    expect(onMyWorkTab(items, 'all')).toHaveLength(6);
  });

  it('groups reviews and drafts as policies', () => {
    expect(onMyWorkTab(items, 'policies').map((i) => i.id)).toEqual(['P2', 'P3']);
    expect(onMyWorkTab(items, 'proof').map((i) => i.id)).toEqual(['a']);
    expect(onMyWorkTab(items, 'approve').map((i) => i.id)).toEqual(['P1']);
    expect(onMyWorkTab(items, 'breach').map((i) => i.id)).toEqual(['b']);
    expect(onMyWorkTab(items, 'request').map((i) => i.id)).toEqual(['r']);
  });
});

describe('myWorkHref', () => {
  it('opens a breach, a request, proof or a policy on its own page', () => {
    expect(myWorkHref(item('proof', 'a'))).toBe('/proof/a');
    expect(myWorkHref(item('draft', 'P3'))).toBe('/policies/P3');
    expect(myWorkHref(item('breach', 'b'))).toBe('/breaches/b');
    expect(myWorkHref(item('request', 'r'))).toBe('/requests/r');
  });
});
