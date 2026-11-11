import {
  ACCESS_LEVELS,
  APP_ROLES,
  ACTIVITY_ACTIONS,
  EXPORT_DATASETS,
  CONTROL_STATUSES,
  DPDP_RULES,
  POLICY_STATUSES,
  ERROR_CODES,
  JOB_ROLES,
  LOCALES,
  PROFILE_FIELDS,
  PROFILE_GROUPS,
} from '@dpdp-kit/shared';
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

  it('words every download on the exports page', () => {
    const { datasets } = catalogs.en.exports as { datasets: Tree };
    expect(Object.keys(datasets).sort()).toEqual([...EXPORT_DATASETS].sort());
    for (const key of EXPORT_DATASETS) {
      expect(Object.keys(datasets[key] as Tree).sort()).toEqual(['about', 'name']);
    }
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
