export type Environment = 'production' | 'non-production';

const PRODUCTION = new Set(['prod', 'production', 'prd', 'live']);
const NON_PRODUCTION = new Set([
  'dev',
  'development',
  'test',
  'testing',
  'qa',
  'uat',
  'stage',
  'staging',
  'sandbox',
  'preprod',
  'nonprod',
  'demo',
]);

const wordsOf = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

function classify(words: string[]): Environment | null {
  if (words.some((word) => NON_PRODUCTION.has(word))) return 'non-production';
  return words.some((word) => PRODUCTION.has(word)) ? 'production' : null;
}

/**
 * Which environment a resource group is for: by its `environment` tag when it has one, and otherwise by the words in
 * its name, such as `rg-shop-prod`. A name that says both, such as `prod-to-staging-sync`, counts as non-production,
 * because separation is only shown by a group that is plainly not production. Null when it says neither.
 */
export function environmentOf(group: {
  name: string;
  tags?: Record<string, string>;
}): Environment | null {
  const tagged = Object.entries(group.tags ?? {})
    .filter(([key]) => /^env(ironment)?$/i.test(key))
    .flatMap(([, value]) => wordsOf(value));
  return classify(tagged) ?? classify(wordsOf(group.name));
}
