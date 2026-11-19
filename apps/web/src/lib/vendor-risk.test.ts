import type { VendorResponse } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { barPosition, currentRisk, levelRange } from './vendor-risk';

const vendor = (over: Partial<VendorResponse>) =>
  ({ inherent: null, residual: null, ...over }) as VendorResponse;

describe('levelRange', () => {
  it('runs from where a level starts to just before the next', () => {
    expect(levelRange('very_low')).toEqual({ from: 1, to: 1 });
    expect(levelRange('low')).toEqual({ from: 2, to: 4 });
    expect(levelRange('high')).toEqual({ from: 10, to: 16 });
    expect(levelRange('very_high')).toEqual({ from: 17, to: 25 });
  });
});

describe('barPosition', () => {
  it('puts a score in its own fifth of the bar, further along the higher it is', () => {
    const low = barPosition({ score: 2, level: 'low' });
    const lowTop = barPosition({ score: 4, level: 'low' });
    expect(low).toBeGreaterThan(0.2);
    expect(lowTop).toBeLessThan(0.4);
    expect(lowTop).toBeGreaterThan(low);
    expect(barPosition({ score: 25, level: 'very_high' })).toBeLessThanOrEqual(1);
  });
});

describe('currentRisk', () => {
  it('is the risk after the measures once rated, else the one before, else nothing', () => {
    expect(currentRisk(vendor({}))).toBeNull();
    const inherent = { likelihood: 4 as const, impact: 4 as const };
    expect(currentRisk(vendor({ inherent }))?.level).toBe('high');
    const residual = { likelihood: 1 as const, impact: 2 as const };
    expect(currentRisk(vendor({ inherent, residual }))).toEqual({ score: 2, level: 'low' });
  });
});
