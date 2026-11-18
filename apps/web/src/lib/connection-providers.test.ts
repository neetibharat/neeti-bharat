import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import { CATALOG, CATALOG_PROVIDER_IDS, CATALOG_TAG_IDS } from './connection-providers';

const catalog = en.connections.catalog as unknown as {
  providers: Record<string, Record<string, string>>;
  tags: Record<string, string>;
};

describe('the connections catalog', () => {
  it('lists each provider once, and the ones that cannot be connected yet say so', () => {
    expect(CATALOG.map((provider) => provider.id)).toEqual([...CATALOG_PROVIDER_IDS]);
    expect(CATALOG.filter((provider) => provider.available).map((p) => p.id)).toEqual([
      'azure',
      'github',
    ]);
  });

  it('words every provider: its name, its kind and what it does', () => {
    expect(Object.keys(catalog.providers).sort()).toEqual([...CATALOG_PROVIDER_IDS].sort());
    for (const id of CATALOG_PROVIDER_IDS) {
      expect(Object.keys(catalog.providers[id]!).sort(), id).toEqual(['about', 'category', 'name']);
    }
  });

  it('words every tag that a provider uses', () => {
    expect(Object.keys(catalog.tags).sort()).toEqual([...CATALOG_TAG_IDS].sort());
    for (const provider of CATALOG) {
      for (const tag of provider.tags) expect(catalog.tags[tag], tag).toBeTruthy();
    }
  });
});
