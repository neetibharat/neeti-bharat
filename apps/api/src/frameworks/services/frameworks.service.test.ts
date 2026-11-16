import { describe, expect, it, vi } from 'vitest';
import type { RoleHolderReader } from '../../people/services/role-holder-reader';
import type { ProfileService } from '../../profile/services/profile.service';
import type { ControlRepository, ControlWithLinks } from '../repositories/control.repository';
import type { FrameworkRepository } from '../repositories/framework.repository';
import type { RequirementRepository } from '../repositories/requirement.repository';
import { RuleReader } from './rule-reader';
import { dpdpRows } from '../utils/catalogue-rows';
import type { PolicyRepository } from '../repositories/policy.repository';
import { FrameworksService } from './frameworks.service';

// R6-01 is covered by the encryption policy (owned by the Security Lead) and the secure-development one.
const control = (over: Partial<ControlWithLinks> = {}): ControlWithLinks =>
  ({
    id: 'DPDP-R6-01',
    frameworkId: 'dpdp',
    requirementId: 'R6',
    title: 'Encryption at rest and in transit',
    description: 'Personal data is encrypted.',
    ownerRole: null,
    archivedAt: null,
    templateId: 'DPDP-R6-01',
    assignee: null,
    reviewDate: null,
    _count: { evidence: 1 },
    proofRequirements: [],
    policies: [
      { policyId: 'P05', position: 0 },
      { policyId: 'P16', position: 1 },
    ],
    ...over,
  }) as ControlWithLinks;

const policyRow = (id: string, title: string, ownerRole: string, status: string) => ({
  id,
  title,
  summary: '',
  ownerRole,
  approverTitle: 'DPO',
  approver: null,
  reviewEvery: 'annual',
  status,
  approvedAt: null,
  _count: { controls: 1, approvals: 0 },
});

const orgControl = control({
  id: 'DPDP-ORG-01',
  frameworkId: 'dpdp',
  requirementId: 'ORG',
  policies: [{ policyId: 'P03', position: 0 }],
});

function build(
  stored: ControlWithLinks | null = control(),
  answers: Record<string, string> = {},
  p05 = 'draft',
) {
  const controls = {
    findActive: vi.fn().mockResolvedValue([stored, orgControl].filter(Boolean)),
    findArchived: vi.fn().mockResolvedValue([]),
    findOne: vi.fn().mockResolvedValue(stored),
    update: vi.fn().mockResolvedValue({}),
  } as unknown as ControlRepository;
  const policies = {
    findActive: vi
      .fn()
      .mockResolvedValue([
        policyRow('P03', 'Information Security Policy', 'SECURITY_LEAD', 'draft'),
        policyRow('P05', 'Encryption Standard', 'SECURITY_LEAD', p05),
        policyRow('P16', 'Secure Development', 'ENGINEERING_LEAD', 'approved'),
      ]),
  } as unknown as PolicyRepository;
  const requirements = {
    findActive: vi.fn().mockResolvedValue(dpdpRows().requirements),
    findAllActive: vi.fn().mockResolvedValue(dpdpRows().requirements),
  } as unknown as RequirementRepository;
  const frameworkRepo = {
    findOne: vi.fn(async (id: string) =>
      id === 'dpdp' ? { ...dpdpRows().frameworks[0]!, archivedAt: null } : null,
    ),
    findActive: vi.fn().mockResolvedValue([{ ...dpdpRows().frameworks[0]!, archivedAt: null }]),
  } as unknown as FrameworkRepository;
  const holders = {
    holderOf: vi.fn(async (role: string) =>
      role === 'DPO' ? { name: 'Meera', email: 'm@x.in' } : null,
    ),
  } as unknown as RoleHolderReader;
  const profile = {
    list: vi.fn().mockResolvedValue({
      entries: Object.entries(answers).map(([key, value]) => ({ key, value })),
    }),
  } as unknown as ProfileService;
  return {
    service: new FrameworksService(
      controls,
      policies,
      holders,
      new RuleReader(requirements, profile, frameworkRepo),
    ),
    controls,
  };
}

describe('FrameworksService frameworks', () => {
  it('lists the frameworks with how far along each is, counting only the rules that apply', async () => {
    const { frameworks } = await build().service.list();
    expect(frameworks).toHaveLength(1);
    expect(frameworks[0]).toMatchObject({
      id: 'dpdp',
      seal: 'DPDP',
      isBuiltIn: true,
    });
    expect(frameworks[0]).not.toHaveProperty('rulesTotal');
  });

  it('says which framework a checklist is for, and does not find one that does not exist', async () => {
    const result = await build().service.checklist('dpdp');
    expect(result.framework).toMatchObject({ id: 'dpdp', name: 'DPDP Act 2023 and Rules 2025' });
    await expect(build().service.checklist('nope')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('FrameworksService.rulePage', () => {
  it('returns the rule with its controls and only the policies that cover them', async () => {
    const { rule, policies } = await build().service.rulePage('dpdp', 'R6');
    expect(rule.id).toBe('R6');
    expect(rule.controls.map((c) => c.id)).toEqual(['DPDP-R6-01']);
    expect(policies.map((policy) => policy.id)).toEqual(['P05', 'P16']);
    expect(policies[0]).toMatchObject({ title: 'Encryption Standard', controlCount: 1 });
  });

  it('does not find a rule that is not in that framework, or one that does not exist', async () => {
    await expect(build().service.rulePage('dpdp', 'NOPE')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    await expect(build().service.rulePage('nope', 'R6')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('FrameworksService.checklist', () => {
  it('groups controls under their rule, and puts organisation-wide ones last', async () => {
    const { rules } = await build().service.checklist('dpdp');
    expect(rules).toHaveLength(14);
    expect(rules.find((rule) => rule.id === 'R6')!.controls.map((c) => c.id)).toEqual([
      'DPDP-R6-01',
    ]);
    expect(rules.at(-1)).toMatchObject({ id: 'ORG' });
  });

  it('sends organisation-wide controls to the DPO, and names who holds that job', async () => {
    const { rules } = await build().service.checklist('dpdp');
    expect(rules.at(-1)!.controls[0]).toMatchObject({ ownerRole: 'DPO', ownerName: 'Meera' });
  });

  it('owns a control by its primary policy, and lists its policies in order', async () => {
    const { rules } = await build().service.checklist('dpdp');
    const view = rules.find((rule) => rule.id === 'R6')!.controls[0]!;
    expect(view.ownerRole).toBe('SECURITY_LEAD');
    expect(view.policies.map((policy) => policy.id)).toEqual(['P05', 'P16']);
  });

  it('switches off the rules that need a set-up answer when it is no, and on when yes', async () => {
    const off = (await build().service.checklist('dpdp')).rules.filter((rule) => !rule.applies);
    expect(off.map((rule) => rule.id)).toEqual(['R10', 'R11', 'R12', 'R13', 'R15']);
    const on = await build(control(), { sendsDataAbroad: 'yes' }).service.checklist('dpdp');
    expect(on.rules.find((rule) => rule.id === 'R15')!.applies).toBe(true);
  });
});

describe('FrameworksService.checklist status', () => {
  const statusOf = async (service: FrameworksService) =>
    (await service.checklist('dpdp')).rules.find((rule) => rule.id === 'R6')!.controls[0]!;

  it('works a control out from its policies and its proof, and says what is missing', async () => {
    const started = await statusOf(
      build(control({ _count: { evidence: 0 } }), {}, 'in_review').service,
    );
    expect(started).toMatchObject({ status: 'in_progress', policiesApproved: 1, policiesTotal: 2 });
    const blank = await statusOf(build(control({ _count: { evidence: 0 } }), {}, 'draft').service);
    expect(blank.status).toBe('in_progress');
  });

  it('is done only once every policy is approved and it has proof', async () => {
    expect((await statusOf(build(control(), {}, 'approved').service)).status).toBe('done');
    expect((await statusOf(build(control(), {}, 'draft').service)).status).toBe('in_progress');
  });
});
