import { describe, expect, it } from 'vitest';
import { DPDP_CONTROLS } from './index.js';
import { PROOF_FRESH_DAYS, PROOF_FREQUENCIES, proofStatus } from './evidence.js';
import { PROOF_REQUIREMENTS } from './proof-requirements.js';

describe('PROOF_REQUIREMENTS', () => {
  it('has the agreed amount', () => {
    expect(PROOF_REQUIREMENTS).toHaveLength(39);
  });

  it('has unique ids', () => {
    const ids = PROOF_REQUIREMENTS.map((requirement) => requirement.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('puts every requirement under a real control that its policy covers', () => {
    for (const requirement of PROOF_REQUIREMENTS) {
      const control = DPDP_CONTROLS.find((candidate) => candidate.id === requirement.controlId);
      expect(control, requirement.id).toBeDefined();
      const policyId = requirement.id.split('-')[1]!;
      expect(control!.policyIds, requirement.id).toContain(policyId);
    }
  });

  it('only uses frequencies that exist, and gives each a title', () => {
    for (const requirement of PROOF_REQUIREMENTS) {
      expect(PROOF_FREQUENCIES).toContain(requirement.frequency);
      expect(requirement.title.length).toBeGreaterThan(5);
    }
  });
});

describe('proofStatus', () => {
  const now = new Date('2026-11-10T00:00:00Z');
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  it('is missing until something is provided', () => {
    expect(proofStatus(null, 'yearly', now)).toBe('missing');
  });

  it('is provided while the proof is still within its frequency', () => {
    expect(proofStatus(daysAgo(30), 'yearly', now)).toBe('provided');
    expect(proofStatus(daysAgo(30), 'monthly', now)).toBe('provided');
  });

  it('is due again once the proof is older than its frequency', () => {
    expect(proofStatus(daysAgo(32), 'monthly', now)).toBe('due');
    expect(proofStatus(daysAgo(100), 'quarterly', now)).toBe('due');
    expect(proofStatus(daysAgo(400), 'yearly', now)).toBe('due');
  });

  it('never goes out of date for proof that is only needed once', () => {
    expect(PROOF_FRESH_DAYS.once).toBeNull();
    expect(proofStatus(daysAgo(5000), 'once', now)).toBe('provided');
  });
});
