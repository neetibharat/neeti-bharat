import {
  ACCESS_LEVELS,
  APP_ROLES,
  ACTIVITY_ACTIONS,
  AZURE_CHECK_GROUPS,
  AZURE_CHECK_IDS,
  SKIPPED_REASONS,
  EXPORT_DATASETS,
  READINESS_ANSWERS,
  READINESS_BANDS,
  READINESS_DOMAINS,
  READINESS_QUESTIONS,
  WEBSITE_CHECK_IDS,
  CONTROL_STATUSES,
  DPDP_RULES,
  POLICY_STATUSES,
  ERROR_CODES,
  JOB_ROLES,
  LOCALES,
  PROFILE_FIELDS,
  PROFILE_GROUPS,
} from '@dpdp-kit/shared';
import { WEBSITE_MESSAGE_KEYS } from '../lib/website-check';
import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';

type Tree = { [key: string]: string | Tree };

const catalogs: Record<(typeof LOCALES)[number], Tree> = { en };

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

  it('has a sentence and a filter name for every kind of change in the activity log', () => {
    const { actions, actionNames } = catalogs.en.activity as { actions: Tree; actionNames: Tree };
    expect(Object.keys(actions).sort()).toEqual([...ACTIVITY_ACTIONS].sort());
    expect(Object.keys(actionNames).sort()).toEqual([...ACTIVITY_ACTIONS].sort());
  });

  it('words every Azure check: its name, what it looks at, a pass and a problem', () => {
    const { checks, groups, skipped } = catalogs.en.connections as {
      checks: Record<string, Tree>;
      groups: Tree;
      skipped: Tree;
    };
    expect(Object.keys(checks).sort()).toEqual([...AZURE_CHECK_IDS].sort());
    for (const id of AZURE_CHECK_IDS) {
      expect(Object.keys(checks[id]!).sort(), id).toEqual(['about', 'name', 'pass', 'problem']);
    }
    for (const group of AZURE_CHECK_GROUPS) {
      expect(Object.keys(groups[group.id] as Tree).sort(), group.id).toEqual(['about', 'title']);
    }
    expect(Object.keys(skipped).sort()).toEqual([...SKIPPED_REASONS].sort());
  });

  it('words every download on the exports page', () => {
    const { datasets } = catalogs.en.exports as { datasets: Tree };
    expect(Object.keys(datasets).sort()).toEqual([...EXPORT_DATASETS].sort());
    for (const key of EXPORT_DATASETS) {
      expect(Object.keys(datasets[key] as Tree).sort()).toEqual(['about', 'name']);
    }
  });

  it('words every website check, with the sentences its results can use', () => {
    const { checks } = catalogs.en.websiteCheck as { checks: Tree };
    expect(Object.keys(checks).sort()).toEqual([...WEBSITE_CHECK_IDS].sort());
    for (const id of WEBSITE_CHECK_IDS) {
      const words = Object.keys(checks[id] as Tree).sort();
      expect(words).toEqual(['name', ...WEBSITE_MESSAGE_KEYS[id]].sort());
    }
  });

  it('words every readiness area, question, answer and band', () => {
    const readiness = catalogs.en.readiness as {
      domains: Tree;
      questions: Tree;
      answers: Tree;
      bands: Tree;
      actions: Tree;
    };
    const domainIds = READINESS_DOMAINS.map((domain) => domain.id);
    expect(Object.keys(readiness.domains).sort()).toEqual([...domainIds].sort());
    expect(Object.keys(readiness.actions).sort()).toEqual([...domainIds].sort());
    expect(Object.keys(readiness.questions).sort()).toEqual(
      READINESS_QUESTIONS.map((q) => q.id).sort(),
    );
    expect(Object.keys(readiness.answers).sort()).toEqual([...READINESS_ANSWERS].sort());
    expect(Object.keys(readiness.bands).sort()).toEqual(
      READINESS_BANDS.map((band) => band.id).sort(),
    );
  });

  it('words every company profile answer and group', () => {
    const { fields, groups } = catalogs.en.profile as { fields: Tree; groups: Tree };
    const keys = PROFILE_FIELDS.map((field) => field.key);
    expect(Object.keys(fields).sort()).toEqual([...keys].sort());
    for (const key of keys)
      expect(Object.keys(fields[key] as Tree).sort()).toEqual(['hint', 'label']);
    expect(Object.keys(groups).sort()).toEqual([...PROFILE_GROUPS, 'custom'].sort());
  });

  it('names every job role and every access level, and says what each level means', () => {
    const { jobRoles, roles, people } = catalogs.en as unknown as {
      jobRoles: Tree;
      roles: Tree;
      people: { accessLevels: Tree };
    };
    expect(Object.keys(jobRoles).sort()).toEqual([...JOB_ROLES].sort());
    for (const level of ACCESS_LEVELS) expect(roles).toHaveProperty(level);
    for (const role of APP_ROLES) expect(people.accessLevels).toHaveProperty(role);
  });

  it('words every control status and every condition that switches a rule on', () => {
    const { frameworks, activity } = catalogs.en as unknown as {
      frameworks: { statuses: Tree; appliesWhen: Tree; ruleStatus: Tree };
      activity: { values: Tree };
    };
    const conditions = new Set(DPDP_RULES.map((rule) => rule.appliesWhen));
    conditions.delete('always');
    expect(Object.keys(frameworks.statuses).sort()).toEqual([...CONTROL_STATUSES].sort());
    expect(Object.keys(activity.values).sort()).toEqual([...CONTROL_STATUSES].sort());
    expect(Object.keys(frameworks.appliesWhen).sort()).toEqual([...conditions].sort());
  });

  it('words every policy status', () => {
    const { policies } = catalogs.en as unknown as { policies: { status: Tree } };
    expect(Object.keys(policies.status).sort()).toEqual([...POLICY_STATUSES].sort());
  });
});
