import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import type { PersonDirectory } from '../../people/services/person-directory';
import type { ControlRepository, ControlWithLinks } from '../repositories/control.repository';
import type { PolicyRepository } from '../repositories/policy.repository';
import type { SaveControlInput } from '../dto/control.dto';
import { ControlEditService } from './control-edit.service';
import type { FrameworksService } from './frameworks.service';

const actor = { id: 'u1', label: 'Asha' };

const existing = (over: Partial<ControlWithLinks> = {}): ControlWithLinks =>
  ({
    id: 'DPDP-R7-02',
    requirementId: 'R7',
    title: 'Board intimation',
    description: 'The Board is told.',
    archivedAt: null,
    reviewDate: null,
    assigneeId: null,
    assignee: null,
    policies: [{ policyId: 'P08', position: 0 }],
    ...over,
  }) as ControlWithLinks;

const input = (over: Partial<SaveControlInput> = {}): SaveControlInput => ({
  ownerRole: 'DPO',
  title: 'Board intimation',
  description: 'The Board is told.',
  assigneeId: null,
  reviewDate: null,
  policyIds: ['P08'],
  ...over,
});

function build(control: ControlWithLinks | null = existing()) {
  const controls = {
    findOne: vi.fn().mockResolvedValue(control),
    create: vi.fn().mockResolvedValue(undefined),
    saveDetails: vi.fn().mockResolvedValue(undefined),
    setArchived: vi.fn().mockResolvedValue({}),
  } as unknown as ControlRepository;
  const policies = {
    findActive: vi.fn().mockResolvedValue([
      { id: 'P08', ownerRole: 'DPO' },
      { id: 'P01', ownerRole: 'DPO' },
    ]),
  } as unknown as PolicyRepository;
  const directory = {
    activePeople: vi.fn().mockResolvedValue([
      { id: 'p1', name: 'Priya' },
      { id: 'p2', name: 'Ravi' },
    ]),
  } as unknown as PersonDirectory;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  const frameworks = {
    control: vi.fn().mockResolvedValue({ id: 'x' }),
    assertRule: vi.fn(async (id: string) => {
      if (id === 'R99') throw new AppException('VALIDATION_FAILED', 400);
      return { frameworkId: id.startsWith('custom-') ? 'custom-f1' : 'dpdp' };
    }),
  } as unknown as FrameworksService;
  return {
    service: new ControlEditService(controls, policies, directory, activity, frameworks),
    controls,
    activity,
  };
}

describe('ControlEditService.create', () => {
  it('adds a control under a rule with a generated id, and records it', async () => {
    const { service, controls, activity } = build();
    await service.create({ ...input({ title: 'Our own check' }), requirementId: 'R6' }, actor);
    expect(controls.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^custom-/),
        frameworkId: 'dpdp',
        requirementId: 'R6',
        title: 'Our own check',
      }),
      ['P08'],
    );
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CONTROL_CREATED' }),
    );
  });

  it('puts a control under the framework its rule belongs to', async () => {
    const { service, controls } = build();
    await service.create({ ...input(), requirementId: 'custom-r1' }, actor);
    expect(controls.create).toHaveBeenCalledWith(
      expect.objectContaining({ frameworkId: 'custom-f1', requirementId: 'custom-r1' }),
      expect.anything(),
    );
  });

  it('refuses a rule that does not exist', async () => {
    await expect(
      build().service.create({ ...input(), requirementId: 'R99' }, actor),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('refuses a policy that does not exist, one given twice, or a person who has left', async () => {
    for (const bad of [
      { policyIds: ['P99'] },
      { policyIds: ['P08', 'P08'] },
      { assigneeId: 'gone' },
    ]) {
      await expect(
        build().service.create({ ...input(bad), requirementId: 'R6' }, actor),
      ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    }
  });
});

describe('ControlEditService.save', () => {
  it('saves an edit and records it', async () => {
    const { service, controls, activity } = build();
    await service.save('DPDP-R7-02', input({ title: 'Tell the Board' }), actor);
    expect(controls.saveDetails).toHaveBeenCalledWith(
      'DPDP-R7-02',
      expect.objectContaining({ title: 'Tell the Board' }),
      ['P08'],
    );
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CONTROL_EDITED' }),
    );
  });

  it('records a change of person as its own event, with names', async () => {
    const { service, activity } = build();
    await service.save('DPDP-R7-02', input({ assigneeId: 'p2' }), actor);
    expect(activity.record).toHaveBeenCalledTimes(1);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CONTROL_ASSIGNED',
        before: { value: '' },
        after: { value: 'Ravi' },
      }),
    );
  });

  it('does nothing when the same details are saved again', async () => {
    const { service, controls, activity } = build();
    await service.save('DPDP-R7-02', input(), actor);
    expect(controls.saveDetails).not.toHaveBeenCalled();
    expect(activity.record).not.toHaveBeenCalled();
  });

  it('refuses a control that is missing or archived', async () => {
    await expect(build(null).service.save('x', input(), actor)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    await expect(
      build(existing({ archivedAt: new Date() })).service.save('x', input(), actor),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('ControlEditService.archive and restore', () => {
  it('archives a control and records it', async () => {
    const { service, controls, activity } = build();
    await service.archive('DPDP-R7-02', actor);
    expect(controls.setArchived).toHaveBeenCalledWith('DPDP-R7-02', expect.any(Date));
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CONTROL_ARCHIVED' }),
    );
  });

  it('restores an archived control, and refuses one that is not archived', async () => {
    const archived = build(existing({ archivedAt: new Date() }));
    await archived.service.restore('DPDP-R7-02', actor);
    expect(archived.controls.setArchived).toHaveBeenCalledWith('DPDP-R7-02', null);
    expect(archived.activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CONTROL_RESTORED' }),
    );
    await expect(build().service.restore('DPDP-R7-02', actor)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('ControlEditService.save owner', () => {
  it('changes the owner in the same save, and records it', async () => {
    const { service, controls, activity } = build();
    await service.save('DPDP-R7-02', input({ ownerRole: 'SECURITY_LEAD' }), actor);
    expect(controls.saveDetails).toHaveBeenCalledWith(
      'DPDP-R7-02',
      expect.objectContaining({ ownerRole: 'SECURITY_LEAD' }),
      ['P08'],
    );
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CONTROL_OWNER_CHANGED',
        before: { value: 'DPO' },
        after: { value: 'SECURITY_LEAD' },
      }),
    );
  });

  it('stores nothing and records nothing when the owner is unchanged', async () => {
    const { service, controls, activity } = build();
    await service.save('DPDP-R7-02', input(), actor);
    expect(controls.saveDetails).not.toHaveBeenCalled();
    expect(activity.record).not.toHaveBeenCalled();
  });
});
