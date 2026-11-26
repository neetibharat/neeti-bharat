import type { ProofItemResponse } from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import { proofByControl, proofList, type ProofListQuery } from './proof-list';

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

describe('proofByControl', () => {
  it('groups the requirements under their controls, in the order the controls came', () => {
    const result = proofByControl(items, query());
    expect(result.groups.map((g) => g.controlId)).toEqual(['c1', 'c2']);
    expect(result.groups[0]!.items.map((i) => i.id)).toEqual(['b', 'd', 'a']);
    expect(result.groups[0]!.counts).toEqual({
      all: 3,
      overdue: 1,
      missing: 2,
      due: 0,
      provided: 1,
    });
    expect(result.total).toBe(2);
  });

  it('shows only the controls that have something in the open tab, and only that part of each', () => {
    const result = proofByControl(items, query({ tab: 'missing' }));
    expect(result.groups.map((g) => g.controlId)).toEqual(['c1']);
    expect(result.groups[0]!.items.map((i) => i.id)).toEqual(['b', 'd']);
    // A control's own tally still covers all of its requirements, so its progress stays honest.
    expect(result.groups[0]!.counts.all).toBe(3);
  });

  it('counts requirements for the figures and controls for the tabs', () => {
    const result = proofByControl(items, query());
    expect(result.counts).toEqual({ all: 4, overdue: 1, missing: 2, due: 1, provided: 1 });
    expect(result.controlCounts).toEqual({ all: 2, overdue: 1, missing: 1, due: 1, provided: 1 });
  });

  it('narrows by search and by person, and pages by control', () => {
    expect(proofByControl(items, query({ q: 'backups' })).groups.map((g) => g.controlId)).toEqual([
      'c2',
    ]);
    expect(proofByControl(items, query({ assigneeId: 'p1' })).groups[0]!.items).toHaveLength(1);
    const second = proofByControl(items, query({ page: 2, limit: 1 }));
    expect(second.groups.map((g) => g.controlId)).toEqual(['c2']);
    expect(second.total).toBe(2);
  });
});
