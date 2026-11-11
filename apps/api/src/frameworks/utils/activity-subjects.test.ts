import { describe, expect, it } from 'vitest';
import { aboutControl, aboutFramework, aboutPolicy, aboutRequirement } from './activity-subjects';

describe('activity subjects', () => {
  it('names a control, with the proof when there is one', () => {
    expect(aboutControl({ id: 'c1', title: 'T' })).toEqual({
      subject: { type: 'control', id: 'c1' },
      details: { controlId: 'c1', title: 'T' },
    });
    expect(aboutControl({ id: 'c1', title: 'T' }, { proof: 'Scan' }).details).toEqual({
      controlId: 'c1',
      title: 'T',
      proof: 'Scan',
    });
  });

  it('names a policy, a framework and a rule', () => {
    expect(aboutPolicy({ id: 'P1', title: 'T' }).subject).toEqual({ type: 'policy', id: 'P1' });
    expect(aboutFramework('f1', 'Mine').details).toEqual({ name: 'Mine' });
    expect(aboutRequirement('r1', { reference: 'R1', title: 'T' }, 'Mine').details).toEqual({
      reference: 'R1',
      title: 'T',
      framework: 'Mine',
    });
  });
});
