import { READINESS_DOMAINS, type ReadinessDomainScore } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { READINESS_LINKS, startHere } from './readiness-links';

const score = (
  id: ReadinessDomainScore['id'],
  percent: number,
  points = 10,
): ReadinessDomainScore => ({
  id,
  points,
  earned: (percent / 100) * points,
  percent,
});

describe('READINESS_LINKS', () => {
  it('sends every area somewhere', () => {
    for (const domain of READINESS_DOMAINS) {
      expect(READINESS_LINKS[domain.id]).toMatch(/^\//);
    }
  });
});

describe('startHere', () => {
  it('names the weakest areas first, and only those below the line', () => {
    const result = startHere([
      score('governance', 100),
      score('security', 40),
      score('rights', 0),
      score('vendors', 59),
      score('inventory', 60),
    ]);
    expect(result.map((domain) => domain.id)).toEqual(['rights', 'security', 'vendors']);
  });

  it('shows at most three, and breaks a tie by what the area is worth', () => {
    const result = startHere([
      score('governance', 0, 15),
      score('rights', 0, 15),
      score('security', 0, 20),
      score('vendors', 0, 5),
    ]);
    expect(result).toHaveLength(3);
    expect(result[0]!.id).toBe('security');
  });

  it('is empty when nothing is weak', () => {
    expect(startHere([score('governance', 100), score('rights', 80)])).toEqual([]);
  });
});
