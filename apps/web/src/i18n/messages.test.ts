import { ERROR_CODES, LOCALES } from '@niti-bharat/shared';
import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import hi from '../../messages/hi.json';

type Tree = { [key: string]: string | Tree };

const catalogs: Record<(typeof LOCALES)[number], Tree> = { en, hi };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string'
      ? { ...acc, [path]: value }
      : { ...acc, ...flatten(value, path) };
  }, {});
}

describe('message catalogs', () => {
  const reference = flatten(catalogs.en);

  it.each(LOCALES)('%s has the same keys as English', (locale) => {
    expect(Object.keys(flatten(catalogs[locale])).sort()).toEqual(Object.keys(reference).sort());
  });

  it.each(LOCALES)('%s has no empty messages', (locale) => {
    const empty = Object.entries(flatten(catalogs[locale])).filter(([, text]) => !text.trim());
    expect(empty).toEqual([]);
  });

  it('translates every API error code', () => {
    expect(Object.keys(catalogs.en.errors as Tree).sort()).toEqual([...ERROR_CODES].sort());
  });
});
