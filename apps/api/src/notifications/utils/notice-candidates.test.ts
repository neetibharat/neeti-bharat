import { describe, expect, it } from 'vitest';
import type { MyWorkItem } from '@neeti-bharat/shared';
import { isNoticeTime, noticeCandidates } from './notice-candidates';

const NOW = new Date('2026-11-10T04:00:00Z');
const item = (over: Partial<MyWorkItem>): MyWorkItem => ({
  kind: 'request',
  id: 'r1',
  title: 'Asha',
  context: 'access',
  dueOn: '2026-11-12',
  overdue: false,
  ...over,
});

describe('noticeCandidates', () => {
  it('calls work due within three days "due soon", and late work "overdue"', () => {
    const found = noticeCandidates(
      [item({}), item({ id: 'r2', dueOn: '2026-11-08', overdue: true })],
      NOW,
    );
    expect(found.map((n) => [n.subjectId, n.state])).toEqual([
      ['r1', 'due_soon'],
      ['r2', 'overdue'],
    ]);
  });

  it('leaves out work that is not due yet, and work with no date', () => {
    expect(
      noticeCandidates(
        [
          item({ dueOn: '2026-12-30' }),
          item({ kind: 'draft', dueOn: null }),
          item({ kind: 'approve', dueOn: null }),
        ],
        NOW,
      ),
    ).toEqual([]);
  });

  it('gives a new key when the due date moves, so a moved deadline is worth a new notice', () => {
    const [a] = noticeCandidates([item({})], NOW);
    const [b] = noticeCandidates([item({ dueOn: '2026-11-13' })], NOW);
    expect(a!.dedupeKey).not.toBe(b!.dedupeKey);
  });
});

describe('isNoticeTime', () => {
  it('is the working day in India, from 9:00', () => {
    expect(isNoticeTime(new Date('2026-11-10T03:00:00Z'))).toBe(false); // 8:30 IST
    expect(isNoticeTime(new Date('2026-11-10T03:30:00Z'))).toBe(true); // 9:00 IST
  });
});
