import { describe, expect, it } from 'vitest';
import { DPDP_POLICIES, controlsForPolicy } from './index.js';
import { POLICY_SETTINGS, policyTemplate } from './policy-text.js';

const templateOf = (id: string) => {
  const policy = DPDP_POLICIES.find((candidate) => candidate.id === id)!;
  return policyTemplate(
    { templateId: policy.id, summary: policy.summary },
    controlsForPolicy(policy.id).map(({ title, description }) => ({ title, description })),
  );
};

describe('policyTemplate', () => {
  it('only names settings for policies that exist', () => {
    const ids = new Set(DPDP_POLICIES.map((policy) => policy.id));
    for (const id of Object.keys(POLICY_SETTINGS)) expect(ids.has(id), id).toBe(true);
  });

  it('lists the controls the policy covers as its requirements', () => {
    expect(templateOf('P08').requirements.map((r) => r.title)).toEqual([
      'Breach detection and triage',
      'Board intimation',
      'Data Principal notification',
      'Detailed breach report',
      'Incident management',
    ]);
  });

  it('puts the company name where the summary said "the organisation"', () => {
    const template = templateOf('P01');
    expect(template.purpose).toContain('{{companyName}}');
    expect(template.purpose).not.toMatch(/the organisation/i);
  });

  it('gives a policy the company added no settings of its own', () => {
    expect(policyTemplate({ templateId: null, summary: 'Our own policy.' }, []).settings).toEqual(
      [],
    );
  });
});
