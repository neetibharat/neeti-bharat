import type { ProofItemResponse } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { proofList, type ProofListQuery } from './proof-list';

const item = (id: string, over: Partial<ProofItemResponse> = {}): ProofItemResponse => ({
  id,
  title: `Proof ${id}`,
  frequency: 'yearly',
  status: 'missing',
  controlId: 'c1',
  controlTitle: 'Encryption',
  ruleId: 'R6',
  ownerRole: 'DPO',
  ownerName: null,
  assigneeId: null,
  assigneeName: null,
  dueOn: null,
  overdue: false,
  ...over,
});

const query = (over: Partial<ProofListQuery> = {}): ProofListQuery => ({
  tab: 'all',
  page: 1,
  limit: 25,
  ...over,
});

const items = [
  item('a', { status: 'provided' }),
  item('b', { overdue: true }),
  item('c', { status: 'due', ruleId: 'R8', controlId: 'c2', controlTitle: 'Backups' }),
  item('d', { assigneeId: 'p1', title: 'Signed letter' }),
];

describe('proofList', () => {
  it('puts what is overdue first, then missing, then due again, then provided', () => {
    expect(proofList(items, query(), null).items.map((i) => i.id)).toEqual(['b', 'd', 'c', 'a']);
  });

  it('counts each tab for the narrowing, whichever tab is open', () => {
    const result = proofList(items, query({ tab: 'provided' }), null);
    expect(result.counts).toEqual({ all: 4, overdue: 1, missing: 2, due: 1, provided: 1 });
    expect(result.items.map((i) => i.id)).toEqual(['a']);
    expect(result.total).toBe(1);
  });

  it('narrows by search, person, rule and control, and the counts follow', () => {
    expect(proofList(items, query({ q: 'LETTER' }), null).total).toBe(1);
    expect(proofList(items, query({ assigneeId: 'p1' }), null).items[0]!.id).toBe('d');
    const rule = proofList(items, query({ ruleId: 'R8' }), null);
    expect(rule.counts.all).toBe(1);
    const control = proofList(items, query({ controlId: 'c2' }), {
      id: 'c2',
      title: 'Backups',
      ruleId: 'R8',
    });
    expect(control.items.map((i) => i.id)).toEqual(['c']);
    expect(control.control?.title).toBe('Backups');
    expect(control.rules).toEqual(['R8']);
  });

  it('cuts pages and reports the total across them', () => {
    const many = Array.from({ length: 30 }, (_, n) =>
      item(`x${n}`, { title: `P${String(n).padStart(2, '0')}` }),
    );
    const second = proofList(many, query({ page: 2, limit: 25 }), null);
    expect(second.items).toHaveLength(5);
    expect(second.total).toBe(30);
    expect(second.page).toBe(2);
  });
});
