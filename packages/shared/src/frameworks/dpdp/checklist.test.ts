import { describe, expect, it } from 'vitest';
import { computeControlStatus, type ProofTally } from './checklist.js';

const proof = (required: number, provided: number, attached = provided): ProofTally => ({
  required,
  provided,
  attached,
});
const none = proof(0, 0);

describe('computeControlStatus', () => {
  it('is not started while nothing has moved: draft policies and nothing attached', () => {
    expect(computeControlStatus(['draft', 'draft'], none)).toBe('not_started');
    expect(computeControlStatus([], none)).toBe('not_started');
    expect(computeControlStatus(['draft'], proof(3, 0))).toBe('not_started');
  });

  it('is in progress once a policy is under review or approved, or proof is attached', () => {
    expect(computeControlStatus(['in_review'], none)).toBe('in_progress');
    expect(computeControlStatus(['approved', 'draft'], none)).toBe('in_progress');
    expect(computeControlStatus(['draft'], proof(0, 0, 1))).toBe('in_progress');
  });

  it('stays in progress when every policy is approved but the proof is not in', () => {
    expect(computeControlStatus(['approved'], none)).toBe('in_progress');
    expect(computeControlStatus(['approved'], proof(3, 2))).toBe('in_progress');
  });

  it('stays in progress when the proof is in but a policy is not approved yet', () => {
    expect(computeControlStatus(['approved', 'in_review'], proof(2, 2))).toBe('in_progress');
  });

  it('is done when every policy is approved and every proof requirement is provided', () => {
    expect(computeControlStatus(['approved', 'approved'], proof(3, 3))).toBe('done');
  });

  it('for a control with no requirements, any proof at all is enough', () => {
    expect(computeControlStatus(['approved'], proof(0, 0, 1))).toBe('done');
    expect(computeControlStatus([], proof(0, 0, 1))).toBe('done');
  });
});
