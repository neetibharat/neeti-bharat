import { describe, expect, it } from 'vitest';
import { acceptanceStatus, toMyPolicies, toTeamPolicyRow } from './acceptance-view';

const at = (day: string) => new Date(`${day}T09:00:00.000Z`);
const policy = (id: string, approved: string) => ({
  id,
  title: `Policy ${id}`,
  summary: 'What it says',
  approvedAt: at(approved),
});
const accepted = (policyId: string, day: string, personId = 'p1') => ({
  policyId,
  personId,
  acceptedAt: at(day),
});

describe('acceptanceStatus', () => {
  it('is to do until accepted, accepted once after the last approval, changed before it', () => {
    const p = policy('P1', '2026-10-01');
    expect(acceptanceStatus(p, undefined)).toBe('todo');
    expect(acceptanceStatus(p, at('2026-10-05'))).toBe('accepted');
    expect(acceptanceStatus(p, at('2026-09-20'))).toBe('changed');
  });
});

describe('toMyPolicies', () => {
  const policies = [policy('P1', '2026-10-01'), policy('P2', '2026-10-01')];

  it('shows each policy with the day it was accepted, and is not done until all are accepted', () => {
    const mine = toMyPolicies(policies, [accepted('P1', '2026-10-02')], 'p1');
    expect(mine.items.map((i) => i.status)).toEqual(['accepted', 'todo']);
    expect(mine.items[0]?.acceptedOn).toBe('2026-10-02');
    expect(mine.acceptedAll).toBe(false);
  });

  it('is done when every policy is accepted in its current form', () => {
    const all = [accepted('P1', '2026-10-02'), accepted('P2', '2026-10-03')];
    expect(toMyPolicies(policies, all, 'p1').acceptedAll).toBe(true);
    expect(toMyPolicies([], [], 'p1').acceptedAll).toBe(false);
  });
});

describe('toTeamPolicyRow', () => {
  it('counts what one person accepted in its current form', () => {
    const policies = [policy('P1', '2026-10-01'), policy('P2', '2026-10-10')];
    const got = [
      accepted('P1', '2026-10-02'),
      accepted('P2', '2026-10-05'),
      accepted('P1', '2026-10-02', 'p2'),
    ];
    expect(toTeamPolicyRow(policies, got, 'p1')).toEqual({ personId: 'p1', accepted: 1, total: 2 });
  });
});
