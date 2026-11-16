import type { PolicyResponse } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { attentionItems, nextDrafts } from './policy-attention';

const NOW = new Date('2026-11-10T12:00:00Z');
const inDays = (days: number) => new Date(NOW.getTime() + days * 86_400_000).toISOString();

const policy = (id: string, status: string, reviewDueAt: string | null = null) =>
  ({ id, status, reviewDueAt }) as unknown as PolicyResponse;

describe('attentionItems', () => {
  it('lists overdue reviews, then policies waiting for approval, then reviews coming up', () => {
    const items = attentionItems(
      [
        policy('soon', 'approved', inDays(10)),
        policy('waiting', 'in_review'),
        policy('late', 'approved', inDays(-5)),
      ],
      NOW,
    );
    expect(items.map((i) => [i.policy.id, i.reason, i.days])).toEqual([
      ['late', 'review_overdue', 5],
      ['waiting', 'awaiting_approval', 0],
      ['soon', 'review_soon', 10],
    ]);
  });

  it('leaves out drafts, far-off reviews and approved policies with no date', () => {
    const items = attentionItems(
      [
        policy('d', 'draft'),
        policy('far', 'approved', inDays(200)),
        policy('none', 'approved', null),
      ],
      NOW,
    );
    expect(items).toEqual([]);
  });

  it('puts the most overdue first', () => {
    const items = attentionItems(
      [policy('a', 'approved', inDays(-2)), policy('b', 'approved', inDays(-9))],
      NOW,
    );
    expect(items.map((i) => i.policy.id)).toEqual(['b', 'a']);
  });
});

describe('nextDrafts', () => {
  it('is the first drafts in order, up to the count', () => {
    const all = [
      policy('a', 'approved'),
      policy('b', 'draft'),
      policy('c', 'draft'),
      policy('d', 'draft'),
    ];
    expect(nextDrafts(all, 2).map((p) => p.id)).toEqual(['b', 'c']);
    expect(nextDrafts([policy('a', 'approved')], 3)).toEqual([]);
  });
});
