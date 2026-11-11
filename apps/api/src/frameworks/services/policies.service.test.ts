import type { PolicyDocument } from '@dpdp-kit/shared';
import { describe, expect, it, vi } from 'vitest';
import { AppException } from '../../core/common/app.exception';
import type { ActivityService } from '../../activity/services/activity.service';
import type { PersonDirectory } from '../../people/services/person-directory';
import type { ProfileService } from '../../profile/services/profile.service';
import type { PolicyRepository, PolicyWithDetail } from '../repositories/policy.repository';
import { PoliciesService, type PolicyActor } from './policies.service';

const admin: PolicyActor = { id: 'u1', label: 'Asha', email: 'asha@x.in', isAdmin: true };
const member: PolicyActor = { id: 'u2', label: 'Ravi', email: 'ravi@x.in', isAdmin: false };

const DOC: PolicyDocument = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello {{companyName}}' }] }],
};

const row = (status = 'draft', over: Record<string, unknown> = {}): PolicyWithDetail =>
  ({
    id: 'P08',
    templateId: 'P08',
    title: 'Incident Response Policy',
    summary: 'Defines how the organisation handles breaches.',
    ownerRole: 'DPO',
    approverTitle: 'Chief Executive Officer',
    approver: null,
    approverId: null,
    reviewEvery: 'annual',
    legalReferences: ['Rule 7'],
    evidence: ['Incident register'],
    status,
    content: null,
    contentEditedAt: null,
    contentEditedByName: null,
    updatedAt: new Date('2026-11-01T00:00:00Z'),
    changelog: null,
    approvedAt: null,
    approvedByName: null,
    archivedAt: null,
    _count: { controls: 1, approvals: 0 },
    controls: [
      {
        control: {
          id: 'c1',
          title: 'Board intimation',
          description: 'The Board is told.',
          archivedAt: null,
        },
      },
    ],
    approvals: [],
    ...over,
  }) as unknown as PolicyWithDetail;

function build(policy: PolicyWithDetail | null = row(), answers: Record<string, string> = {}) {
  const repository = {
    findActive: vi.fn().mockResolvedValue(policy ? [policy] : []),
    findOne: vi.fn().mockResolvedValue(policy),
    findVersion: vi.fn().mockResolvedValue({
      version: 2,
      approvedAt: new Date('2026-11-10T00:00:00Z'),
      approvedByName: 'Asha',
      changelog: 'Tightened scope',
      content: DOC,
    }),
    saveContent: vi.fn().mockResolvedValue({}),
    setApprover: vi.fn().mockResolvedValue({}),
    setStatus: vi.fn().mockResolvedValue(true),
    approve: vi.fn().mockResolvedValue(1),
  } as unknown as PolicyRepository;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  const profile = {
    list: vi.fn().mockResolvedValue({
      entries: Object.entries(answers).map(([key, value]) => ({ key, value })),
    }),
  } as unknown as ProfileService;
  const directory = {
    activePeople: vi.fn().mockResolvedValue([{ id: 'p1', name: 'Priya' }]),
    requireActive: vi.fn(async (id: string) => {
      const person = [{ id: 'p1', name: 'Priya' }].find((p) => p.id === id);
      if (!person) throw new AppException('VALIDATION_FAILED', 400);
      return person;
    }),
  } as unknown as PersonDirectory;
  return {
    service: new PoliciesService(repository, activity, profile, directory),
    repository,
    activity,
  };
}

describe('PoliciesService.list and detail', () => {
  it('lists policies with their standing, who approves, and how many controls they cover', async () => {
    const { policies } = await build().service.list();
    expect(policies[0]).toMatchObject({
      id: 'P08',
      status: 'draft',
      approver: 'Chief Executive Officer',
      approverPerson: null,
      controlCount: 1,
    });
    expect(policies[0]).not.toHaveProperty('legalReferences');
  });

  it('starts with text built from the controls, and says it has not been edited', async () => {
    const detail = await build(row(), {
      companyName: 'Acme',
      breachReportWindow: '72 hours',
    }).service.detail('P08', admin);
    expect(JSON.stringify(detail.content)).toContain('Board intimation.');
    expect(detail.values).toMatchObject({
      companyName: 'Acme',
      breachReportWindow: '72 hours',
      breachContact: '',
    });
  });

  it('shows the saved text once someone has edited it, with the answers it quotes', async () => {
    const detail = await build(row('draft', { content: DOC }), {
      companyName: 'Acme',
    }).service.detail('P08', admin);
    expect(detail.content).toEqual(DOC);
    expect(detail.values).toEqual({ companyName: 'Acme' });
  });

  it('says when and by whom the text was last saved, and nothing while it is the starting text', async () => {
    const start = await build().service.detail('P08', admin);
    expect(start).toMatchObject({ editedAt: null, editedByName: null });
    const saved = await build(
      row('draft', {
        content: DOC,
        contentEditedAt: new Date('2026-11-05T10:00:00Z'),
        contentEditedByName: 'Ravi',
      }),
    ).service.detail('P08', admin);
    expect(saved).toMatchObject({ editedAt: '2026-11-05T10:00:00.000Z', editedByName: 'Ravi' });
  });

  it('falls back to the last change for text saved before edits were recorded', async () => {
    const old = await build(row('draft', { content: DOC })).service.detail('P08', admin);
    expect(old).toMatchObject({ editedAt: '2026-11-01T00:00:00.000Z', editedByName: null });
  });

  it('refuses a policy that does not exist or has been archived', async () => {
    await expect(build(null).service.detail('P99', admin)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    await expect(
      build(row('draft', { archivedAt: new Date() })).service.detail('P08', admin),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('PoliciesService.detail and who may decide', () => {
  it('lets an admin decide when nobody is named, and a member not', async () => {
    expect((await build().service.detail('P08', admin)).canDecide).toBe(true);
    expect((await build().service.detail('P08', member)).canDecide).toBe(false);
  });

  it('lets only the named approver decide', async () => {
    const named = { id: 'p1', name: 'Ravi', email: 'ravi@x.in' };
    const policy = () => row('in_review', { approver: named, approverId: 'p1' });
    expect((await build(policy()).service.detail('P08', member)).canDecide).toBe(true);
    expect((await build(policy()).service.detail('P08', admin)).canDecide).toBe(false);
  });
});

describe('PoliciesService.version', () => {
  it('returns one approved version with its text and the answers it quotes', async () => {
    const result = await build(row(), { companyName: 'Acme' }).service.version('P08', 2);
    expect(result).toMatchObject({ values: { companyName: 'Acme' } });
    expect(Object.keys(result).sort()).toEqual(['content', 'values']);
  });

  it('refuses a version that does not exist', async () => {
    const { service, repository } = build();
    vi.mocked(repository.findVersion).mockResolvedValue(null);
    await expect(service.version('P08', 9)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('PoliciesService.saveContent', () => {
  it('saves the text of a draft and records it', async () => {
    const { service, repository, activity } = build();
    await service.saveContent('P08', DOC, member);
    expect(repository.saveContent).toHaveBeenCalledWith('P08', DOC, 'Ravi');
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'POLICY_EDITED' }),
    );
  });

  it('refuses to edit a policy that is in review or approved', async () => {
    for (const status of ['in_review', 'approved']) {
      await expect(build(row(status)).service.saveContent('P08', DOC, admin)).rejects.toMatchObject(
        { code: 'CONFLICT' },
      );
    }
  });
});

describe('PoliciesService.setApprover', () => {
  it('names a person who works here, and records the change with names', async () => {
    const { service, repository, activity } = build();
    await service.setApprover('P08', 'p1', admin);
    expect(repository.setApprover).toHaveBeenCalledWith('P08', 'p1');
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'POLICY_APPROVER_CHANGED',
        before: { value: '' },
        after: { value: 'Priya' },
      }),
    );
  });

  it('refuses a person who is not there, and does nothing when nothing changes', async () => {
    await expect(build().service.setApprover('P08', 'gone', admin)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    const same = build();
    await same.service.setApprover('P08', null, admin);
    expect(same.repository.setApprover).not.toHaveBeenCalled();
  });
});

describe('PoliciesService.changeStatus', () => {
  it('lets a member ask for approval, keeping what they say changed', async () => {
    const { service, repository, activity } = build();
    await service.changeStatus('P08', 'in_review', member, 'Added a scope');
    expect(repository.setStatus).toHaveBeenCalledWith('P08', 'draft', 'in_review', 'Added a scope');
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'POLICY_REVIEW_REQUESTED' }),
    );
  });

  it('lets an admin approve when nobody is named, keeping the text and what changed as a version', async () => {
    const { service, repository, activity } = build(
      row('in_review', { content: DOC, changelog: 'Added a scope' }),
    );
    await service.changeStatus('P08', 'approved', admin);
    expect(repository.approve).toHaveBeenCalledWith(
      'P08',
      'in_review',
      { id: 'u1', name: 'Asha' },
      DOC,
      'Added a scope',
    );
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'POLICY_APPROVED' }),
    );
  });

  it('keeps the starting text as the version when nobody edited the policy', async () => {
    const { service, repository } = build(row('in_review'));
    await service.changeStatus('P08', 'approved', admin);
    const kept = vi.mocked(repository.approve).mock.calls[0]![3];
    expect(JSON.stringify(kept)).toContain('Board intimation.');
  });

  it('keeps deciding for admins when nobody is named', async () => {
    for (const [from, to] of [
      ['in_review', 'approved'],
      ['in_review', 'draft'],
      ['approved', 'draft'],
    ] as const) {
      await expect(build(row(from)).service.changeStatus('P08', to, member)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    }
  });

  it('leaves deciding to the named approver alone, even over an admin', async () => {
    const named = { id: 'p1', name: 'Ravi', email: 'RAVI@x.in' };
    const policy = () => row('in_review', { approver: named, approverId: 'p1' });
    await expect(
      build(policy()).service.changeStatus('P08', 'approved', admin),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const ok = build(policy());
    await ok.service.changeStatus('P08', 'approved', member);
    expect(ok.repository.approve).toHaveBeenCalled();
  });

  it('refuses with a conflict when someone else already moved the policy', async () => {
    const { service, repository, activity } = build(row('in_review'));
    vi.mocked(repository.approve).mockResolvedValueOnce(null);
    await expect(service.changeStatus('P08', 'approved', admin)).rejects.toMatchObject({
      code: 'CONFLICT',
    });
    expect(activity.record).not.toHaveBeenCalled();
  });

  it('records sending back and reopening as their own actions', async () => {
    const back = build(row('in_review'));
    await back.service.changeStatus('P08', 'draft', admin);
    expect(back.activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'POLICY_SENT_BACK' }),
    );
    const reopen = build(row('approved'));
    await reopen.service.changeStatus('P08', 'draft', admin);
    expect(reopen.activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'POLICY_REOPENED' }),
    );
  });

  it('refuses a move the policy cannot make, such as approving a draft', async () => {
    const { service, repository, activity } = build(row('draft'));
    await expect(service.changeStatus('P08', 'approved', admin)).rejects.toMatchObject({
      code: 'CONFLICT',
    });
    expect(repository.approve).not.toHaveBeenCalled();
    expect(activity.record).not.toHaveBeenCalled();
  });
});
