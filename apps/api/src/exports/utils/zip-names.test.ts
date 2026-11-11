import { describe, expect, it } from 'vitest';
import { dayStamp, safeName } from './zip-names';

describe('safeName', () => {
  it('removes folders and characters a system refuses', () => {
    expect(safeName('../../etc/passwd')).toBe('_.._etc_passwd');
    expect(safeName('a:b*c?.pdf')).toBe('a_b_c_.pdf');
  });

  it('does not start with a dot and is never empty', () => {
    expect(safeName('..hidden')).toBe('hidden');
    expect(safeName('', 'proof')).toBe('proof');
  });
});

describe('dayStamp', () => {
  it('is the date in UTC', () => {
    expect(dayStamp(new Date('2026-11-11T23:00:00Z'))).toBe('2026-11-11');
  });
});
