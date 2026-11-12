import { describe, expect, it } from 'vitest';
import { outcomeKey } from './connections';

describe('outcomeKey', () => {
  it('has a sentence for a pass, and one for any problem, warned or failed', () => {
    expect(outcomeKey({ id: 'sql_tls', status: 'pass' })).toBe('pass');
    expect(outcomeKey({ id: 'sql_tls', status: 'warn' })).toBe('problem');
    expect(outcomeKey({ id: 'sql_tls', status: 'fail' })).toBe('problem');
  });

  it('says why a check gave no answer', () => {
    expect(outcomeKey({ id: 'sql_tls', status: 'skipped', reason: 'access' })).toBe(
      'skipped.access',
    );
    expect(outcomeKey({ id: 'sql_tls', status: 'skipped', reason: 'none' })).toBe('skipped.none');
  });

  it('treats a skipped check with no reason as an error', () => {
    expect(outcomeKey({ id: 'sql_tls', status: 'skipped' })).toBe('skipped.error');
  });
});
