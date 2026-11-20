import { describe, expect, it } from 'vitest';
import { buildGroups } from './search-groups';

const words = { t: (key: string) => key, tNav: (key: string) => key };
const who = { isAdmin: true, canEdit: true };
const none = { needle: '', who, words, hits: [], recent: [] };

const keysOf = (groups: ReturnType<typeof buildGroups>) =>
  groups.flatMap((group) => group.items.map((item) => item.key));

describe('buildGroups', () => {
  it('shows the quick actions when nothing is typed', () => {
    const groups = buildGroups(none);
    expect(groups.map((group) => group.id)).toEqual(['actions']);
  });

  it('never lists a result twice, even when it was opened lately', () => {
    const recent = [{ key: 'action:breach', href: '/breaches?new=1', title: 'Log a breach' }];
    const keys = keysOf(buildGroups({ ...none, recent }));
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.filter((key) => key === 'action:breach')).toHaveLength(1);
  });

  it('shows the pages for an auditor with nothing opened lately', () => {
    const groups = buildGroups({ ...none, who: { isAdmin: false, canEdit: false } });
    expect(groups.map((group) => group.id)).toEqual(['pages']);
  });

  it('leaves the people out of the records for someone who is not an admin', () => {
    const hits = [{ kind: 'person', id: 'p1', title: 'Priya' } as const];
    const groups = buildGroups({
      ...none,
      needle: 'pri',
      who: { isAdmin: false, canEdit: true },
      hits: [...hits],
    });
    expect(groups.find((group) => group.id === 'records')).toBeUndefined();
  });

  it('hides what was opened lately once something is typed', () => {
    const recent = [{ key: 'page:policies', href: '/policies', title: 'Policies' }];
    const groups = buildGroups({ ...none, needle: 'x', recent });
    expect(groups.find((group) => group.id === 'recent')).toBeUndefined();
  });
});
