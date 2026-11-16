import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import type { SavePolicyInput } from '../dto/policy.dto';
import type { PolicyRepository, PolicyWithDetail } from '../repositories/policy.repository';
import type { PoliciesService, PolicyActor } from './policies.service';
import { PolicyEditService } from './policy-edit.service';
import type { RuleReader } from './rule-reader';

const actor = { id: 'u1', label: 'Asha', email: 'asha@example.com', isAdmin: true } as PolicyActor;

const existing = (over: Partial<PolicyWithDetail> = {}): PolicyWithDetail =>
  ({
    id: 'custom-1',
    title: 'Data sharing',
    summary: 'How we share data.',
    ownerRole: 'DPO',
    approverTitle: 'General Counsel',
    archivedAt: null,
    ...over,
  }) as PolicyWithDetail;

const input = (over: Partial<SavePolicyInput> = {}): SavePolicyInput => ({
  title: 'Data sharing',
  summary: 'How we share data.',
  ownerRole: 'DPO',
  approverTitle: 'General Counsel',
  ...over,
});

function build(policy: PolicyWithDetail | null = existing()) {
  const policies = {
    findOne: vi.fn().mockResolvedValue(policy),
    findArchived: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(undefined),
    saveDetails: vi.fn().mockResolvedValue({}),
    setArchived: vi.fn().mockResolvedValue({}),
  } as unknown as PolicyRepository;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  const rules = {
    framework: vi.fn(async (id: string) => {
      if (id === 'gone') throw new Error('NOT_FOUND');
      return { id };
    }),
  } as unknown as RuleReader;
  const reader = { detail: vi.fn().mockResolvedValue({ id: 'x' }) } as unknown as PoliciesService;
  return { service: new PolicyEditService(policies, activity, rules, reader), policies, activity };
}

describe('PolicyEditService.create', () => {
  it('adds a policy with a generated id under a framework, and records it', async () => {
    const { service, policies, activity } = build();
    await service.create({ ...input({ title: 'Vendor policy' }), frameworkId: 'dpdp' }, actor);
    expect(policies.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^custom-/),
        frameworkId: 'dpdp',
        title: 'Vendor policy',
      }),
    );
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'POLICY_CREATED' }),
    );
  });

  it('refuses a framework that does not exist', async () => {
    const { service, policies } = build();
    await expect(service.create({ ...input(), frameworkId: 'gone' }, actor)).rejects.toThrow();
    expect(policies.create).not.toHaveBeenCalled();
  });
});

describe('PolicyEditService.save', () => {
  it('saves a change and records it', async () => {
    const { service, policies, activity } = build();
    await service.save('custom-1', input({ title: 'Data sharing rules' }), actor);
    expect(policies.saveDetails).toHaveBeenCalledWith(
      'custom-1',
      expect.objectContaining({ title: 'Data sharing rules' }),
    );
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'POLICY_DETAILS_EDITED' }),
    );
  });

  it('records nothing when nothing changed', async () => {
    const { service, policies, activity } = build();
    await service.save('custom-1', input(), actor);
    expect(policies.saveDetails).not.toHaveBeenCalled();
    expect(activity.record).not.toHaveBeenCalled();
  });

  it('does not find an archived policy', async () => {
    const { service } = build(existing({ archivedAt: new Date() }));
    await expect(service.save('custom-1', input(), actor)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('PolicyEditService.archive and restore', () => {
  it('archives a policy and records it', async () => {
    const { service, policies, activity } = build();
    await service.archive('custom-1', actor);
    expect(policies.setArchived).toHaveBeenCalledWith('custom-1', expect.any(Date));
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'POLICY_ARCHIVED' }),
    );
  });

  it('restores an archived policy and records it', async () => {
    const { service, policies, activity } = build(existing({ archivedAt: new Date() }));
    await service.restore('custom-1', actor);
    expect(policies.setArchived).toHaveBeenCalledWith('custom-1', null);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'POLICY_RESTORED' }),
    );
  });

  it('cannot restore a policy that is not archived', async () => {
    await expect(build().service.restore('custom-1', actor)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
