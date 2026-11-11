import { describe, expect, it } from 'vitest';
import { decodeParam } from './route-param';

describe('decodeParam', () => {
  it('decodes percent-encoded text', () => {
    expect(decodeParam('my%20framework')).toBe('my framework');
    expect(decodeParam('R6')).toBe('R6');
  });

  it('gives null for malformed encoding instead of throwing', () => {
    expect(decodeParam('%E0%A4%A')).toBeNull();
    expect(decodeParam('100%')).toBeNull();
  });
});
