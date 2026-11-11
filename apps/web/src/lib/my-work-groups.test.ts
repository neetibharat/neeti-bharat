import type { MyWorkItem } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { groupMyWork } from './my-work-groups';

const NOW = new Date('2026-11-10T12:00:00Z');
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();
const item = (id: string, dueOn: string | null, overdue = false): MyWorkItem => ({
  kind: 'proof',
  id,
  title: id,
  context: id,
  dueOn,
  overdue,
});

describe('groupMyWork', () => {
  it('sorts items by how soon they are due and leaves out empty groups', () => {
    const groups = groupMyWork(
      [item('a', day(-2), true), item('b', day(3)), item('c', day(40)), item('d', null)],
      NOW,
    );
    expect(groups.map((g) => [g.id, g.items.map((i) => i.id)])).toEqual([
      ['overdue', ['a']],
      ['week', ['b']],
      ['later', ['c']],
      ['undated', ['d']],
    ]);
    expect(groupMyWork([item('d', null)], NOW).map((g) => g.id)).toEqual(['undated']);
  });
});
