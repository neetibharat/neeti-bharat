import { describe, expect, it } from 'vitest';
import { environmentOf } from './environment';

describe('environmentOf', () => {
  it('reads the words in the name', () => {
    expect(environmentOf({ name: 'rg-shop-prod' })).toBe('production');
    expect(environmentOf({ name: 'Shop_Production_01' })).toBe('production');
    expect(environmentOf({ name: 'rg-shop-dev' })).toBe('non-production');
    expect(environmentOf({ name: 'shop-uat-india' })).toBe('non-production');
    expect(environmentOf({ name: 'shop-staging' })).toBe('non-production');
  });

  it('does not take part of a word for the word', () => {
    expect(environmentOf({ name: 'rg-product-catalog' })).toBeNull();
    expect(environmentOf({ name: 'rg-device-hub' })).toBeNull();
    expect(environmentOf({ name: 'rg-attest' })).toBeNull();
  });

  it('reads an environment tag before the name', () => {
    expect(environmentOf({ name: 'rg-shop', tags: { Environment: 'Production' } })).toBe(
      'production',
    );
    expect(environmentOf({ name: 'rg-prod', tags: { env: 'dev' } })).toBe('non-production');
  });

  it('ignores tags that are not about the environment', () => {
    expect(environmentOf({ name: 'rg-shop', tags: { owner: 'prod-team' } })).toBeNull();
  });

  it('counts a name that says both as non-production', () => {
    expect(environmentOf({ name: 'prod-to-staging-sync' })).toBe('non-production');
  });

  it('is null when it says neither', () => {
    expect(environmentOf({ name: 'rg-shared-network' })).toBeNull();
  });
});
