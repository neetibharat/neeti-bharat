import { describe, expect, it } from 'vitest';
import { riskReading, suggestRating } from './vendors.js';

describe('riskReading', () => {
  it('multiplies likelihood by impact and names the level the score falls in', () => {
    expect(riskReading({ likelihood: 1, impact: 1 })).toEqual({ score: 1, level: 'very_low' });
    expect(riskReading({ likelihood: 2, impact: 2 })).toEqual({ score: 4, level: 'low' });
    expect(riskReading({ likelihood: 3, impact: 3 })).toEqual({ score: 9, level: 'medium' });
    expect(riskReading({ likelihood: 4, impact: 3 })).toEqual({ score: 12, level: 'high' });
    expect(riskReading({ likelihood: 5, impact: 5 })).toEqual({ score: 25, level: 'very_high' });
  });

  it('starts each level on its own score, with no gap between them', () => {
    expect(riskReading({ likelihood: 1, impact: 5 }).level).toBe('medium');
    expect(riskReading({ likelihood: 2, impact: 5 }).level).toBe('high');
    expect(riskReading({ likelihood: 4, impact: 4 }).level).toBe('high');
    expect(riskReading({ likelihood: 5, impact: 4 }).level).toBe('very_high');
  });
});

describe('suggestRating', () => {
  it('says nothing until both the data and the place are said', () => {
    expect(suggestRating([], 'india')).toBeNull();
    expect(suggestRating(['name'], null)).toBeNull();
  });

  it('rates the impact by the data: higher for sensitive data', () => {
    expect(suggestRating(['name'], 'india')?.impact).toBe(3);
    expect(suggestRating(['name', 'health'], 'india')?.impact).toBe(4);
  });

  it('rates the likelihood by the place: higher the more of it is abroad', () => {
    expect(suggestRating(['name'], 'india')?.likelihood).toBe(2);
    expect(suggestRating(['name'], 'both')?.likelihood).toBe(3);
    expect(suggestRating(['name'], 'abroad')?.likelihood).toBe(4);
  });
});
