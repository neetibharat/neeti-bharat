import { describe, expect, it } from 'vitest';
import { BUILT_IN_LOCKED, isLocked } from './framework-edit.js';

describe('isLocked', () => {
  it('closes only built-in frameworks, and only when locking is on', () => {
    expect(isLocked(true, true)).toBe(true);
    expect(isLocked(false, true)).toBe(false);
    expect(isLocked(true, false)).toBe(false);
  });

  it('follows BUILT_IN_LOCKED by default', () => {
    expect(isLocked(true)).toBe(BUILT_IN_LOCKED);
    expect(isLocked(false)).toBe(false);
  });
});
