import { DPDP_CONTROLS, DPDP_POLICIES } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { dpdpRows, planSeed } from './catalogue-rows';

const none = {
  frameworkIds: new Set<string>(),
  requirementIds: new Set<string>(),
  controlIds: new Set<string>(),
  policyIds: new Set<string>(),
  proofIds: new Set<string>(),
};

describe('dpdpRows', () => {
  it('has a row for every control and policy, and a link for every pairing', () => {
    const rows = dpdpRows();
    expect(rows.controls).toHaveLength(DPDP_CONTROLS.length);
    expect(rows.policies).toHaveLength(DPDP_POLICIES.length);
    expect(rows.links).toHaveLength(DPDP_CONTROLS.reduce((n, c) => n + c.policyIds.length, 0));
  });

  it('keeps the catalogue order and marks each control’s own policy as primary', () => {
    const rows = dpdpRows();
    expect(rows.controls.map((row) => row.sortOrder)).toEqual(rows.controls.map((_, i) => i));
    const own = rows.links.find((link) => link.controlId === 'DPDP-R9-01' && link.position === 0);
    expect(own?.policyId).toBe('P11');
  });
});

describe('rules in the seed', () => {
  it('has a row for every rule, in the law’s order, with the organisation group last', () => {
    const ids = dpdpRows().requirements.map((row) => row.id);
    expect(ids).toHaveLength(14);
    expect(ids[0]).toBe('R3');
    expect(ids.at(-1)).toBe('ORG');
  });

  it('points every control at a rule that exists', () => {
    const rows = dpdpRows();
    const ruleIds = new Set(rows.requirements.map((row) => row.id));
    expect(rows.controls.every((control) => ruleIds.has(control.requirementId))).toBe(true);
  });
});

describe('proof requirements in the seed', () => {
  it('adds only the requirements that are not stored yet', () => {
    const rows = dpdpRows();
    const have = new Set(rows.proofRequirements.slice(1).map((row) => row.id));
    const plan = planSeed(rows, {
      frameworkIds: new Set(rows.frameworks.map((row) => row.id)),
      requirementIds: new Set(rows.requirements.map((row) => row.id)),
      controlIds: new Set(rows.controls.map((row) => row.id)),
      policyIds: new Set(rows.policies.map((row) => row.id)),
      proofIds: have,
    });
    expect(plan.proofRequirements.map((row) => row.id)).toEqual([rows.proofRequirements[0]!.id]);
  });
});

describe('planSeed', () => {
  it('stores everything on a fresh database', () => {
    const plan = planSeed(dpdpRows(), none);
    expect(plan.frameworks).toHaveLength(1);
    expect(plan.requirements).toHaveLength(14);
    expect(plan.controls).toHaveLength(47);
    expect(plan.policies).toHaveLength(18);
    expect(plan.proofRequirements).toHaveLength(90);
  });

  it('stores nothing when everything is already there', () => {
    const rows = dpdpRows();
    const plan = planSeed(rows, {
      frameworkIds: new Set(rows.frameworks.map((row) => row.id)),
      requirementIds: new Set(rows.requirements.map((row) => row.id)),
      controlIds: new Set(rows.controls.map((row) => row.id)),
      policyIds: new Set(rows.policies.map((row) => row.id)),
      proofIds: new Set(rows.proofRequirements.map((row) => row.id)),
    });
    expect(plan).toEqual({
      frameworks: [],
      requirements: [],
      controls: [],
      policies: [],
      links: [],
      proofRequirements: [],
    });
  });

  it('adds only what is new, with its links, and never a link the company removed', () => {
    const rows = dpdpRows();
    const plan = planSeed(rows, {
      frameworkIds: new Set(rows.frameworks.map((row) => row.id)),
      requirementIds: new Set(rows.requirements.map((row) => row.id)),
      controlIds: new Set(rows.controls.filter((row) => row.id !== 'DPDP-R7-01').map((r) => r.id)),
      policyIds: new Set(rows.policies.map((row) => row.id)),
      proofIds: new Set(rows.proofRequirements.map((row) => row.id)),
    });
    expect(plan.controls.map((row) => row.id)).toEqual(['DPDP-R7-01']);
    expect(plan.links).toEqual([{ controlId: 'DPDP-R7-01', policyId: 'P08', position: 0 }]);
  });
});
