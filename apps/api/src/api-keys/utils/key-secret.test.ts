import { describe, expect, it } from 'vitest';
import { generateKey, hashKey } from './key-secret';

describe('generateKey', () => {
  it('makes a key that starts with sk_live_ and holds 32 random bytes', () => {
    expect(generateKey().key).toMatch(/^sk_live_[0-9a-f]{64}$/);
  });

  it('makes a different key each time', () => {
    expect(generateKey().key).not.toBe(generateKey().key);
  });

  it('keeps only the start of the key to show, and a hash that matches the key', () => {
    const made = generateKey();
    expect(made.key.startsWith(made.prefix)).toBe(true);
    expect(made.prefix).toHaveLength('sk_live_'.length + 6);
    expect(made.hash).toBe(hashKey(made.key));
    expect(made.hash).not.toContain(made.key);
  });
});
