import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import type { ControlRepository } from '../repositories/control.repository';
import type { FrameworkRepository } from '../repositories/framework.repository';
import type { RequirementRepository } from '../repositories/requirement.repository';
import { FrameworkEditService } from './framework-edit.service';

const actor = { id: 'u1', label: 'Asha' };
const framework = { name: 'Acme security', about: 'Our own checks', seal: 'ACME' };
const rule = { reference: '4.2', title: 'Access reviews', summary: '' };

const own = { id: 'custom-f1', name: 'Acme security', isBuiltIn: false, archivedAt: null };
const builtIn = { id: 'dpdp', name: 'DPDP', isBuiltIn: true, archivedAt: null };
const ownRule = { id: 'custom-r1', frameworkId: 'custom-f1', archivedAt: null, ...rule };

function build(options: { found?: unknown; rule?: unknown; controlCount?: number } = {}) {
  const frameworks = {
    findOne: vi.fn().mockResolvedValue(options.found === undefined ? own : options.found),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    setArchived: vi.fn().mockResolvedValue({}),
  } as unknown as FrameworkRepository;
  const requirements = {
    findOne: vi.fn().mockResolvedValue(options.rule === undefined ? ownRule : options.rule),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    setArchived: vi.fn().mockResolvedValue({}),
  } as unknown as RequirementRepository;
  const controls = {
    countActiveInFramework: vi.fn().mockResolvedValue(options.controlCount ?? 0),
    countActiveInRequirement: vi.fn().mockResolvedValue(options.controlCount ?? 0),
  } as unknown as ControlRepository;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  return {
    service: new FrameworkEditService(frameworks, requirements, controls, activity),
    frameworks,
    requirements,
    activity,
  };
}

describe('FrameworkEditService frameworks', () => {
  it('adds a framework of the company own, with a generated id, and records it', async () => {
    const { service, frameworks, activity } = build();
    const { id } = await service.create(framework, actor);
    expect(id).toMatch(/^custom-/);
    expect(frameworks.create).toHaveBeenCalledWith({ id, ...framework });
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'FRAMEWORK_CREATED', details: { name: 'Acme security' } }),
    );
  });

  it('changes and archives one the company made', async () => {
    const { service, frameworks } = build();
    await service.update('custom-f1', framework, actor);
    expect(frameworks.update).toHaveBeenCalledWith('custom-f1', framework);
    await service.archive('custom-f1', actor);
    expect(frameworks.setArchived).toHaveBeenCalledWith('custom-f1', expect.any(Date));
  });

  it('changes a built-in framework while built-in ones are open', async () => {
    const { service, frameworks } = build({ found: builtIn });
    await service.update('dpdp', framework, actor);
    expect(frameworks.update).toHaveBeenCalledWith('dpdp', framework);
    await service.archive('dpdp', actor);
    expect(frameworks.setArchived).toHaveBeenCalledWith('dpdp', expect.any(Date));
  });

  it('does not find a framework that is missing or archived', async () => {
    await expect(
      build({ found: null }).service.update('x', framework, actor),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    const archived = { ...own, archivedAt: new Date() };
    await expect(
      build({ found: archived }).service.archive('custom-f1', actor),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('will not archive a framework that still has controls', async () => {
    const { service, frameworks } = build({ controlCount: 2 });
    await expect(service.archive('custom-f1', actor)).rejects.toMatchObject({
      code: 'HAS_CONTROLS',
    });
    expect(frameworks.setArchived).not.toHaveBeenCalled();
  });
});

describe('FrameworkEditService rules', () => {
  it('adds a rule to a framework the company made, and records which framework', async () => {
    const { service, requirements, activity } = build();
    const { id } = await service.createRequirement('custom-f1', rule, actor);
    expect(requirements.create).toHaveBeenCalledWith({ id, frameworkId: 'custom-f1', ...rule });
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REQUIREMENT_CREATED',
        details: { reference: '4.2', title: 'Access reviews', framework: 'Acme security' },
      }),
    );
  });

  it('adds, changes and archives a rule of a built-in framework while built-in ones are open', async () => {
    const { service, requirements } = build({ found: builtIn });
    await service.createRequirement('dpdp', rule, actor);
    await service.updateRequirement('custom-r1', rule, actor);
    await service.archiveRequirement('custom-r1', actor);
    expect(requirements.create).toHaveBeenCalled();
    expect(requirements.update).toHaveBeenCalledWith('custom-r1', rule);
    expect(requirements.setArchived).toHaveBeenCalled();
  });

  it('changes a rule, and will not archive one that still has controls', async () => {
    const { service, requirements } = build();
    await service.updateRequirement('custom-r1', rule, actor);
    expect(requirements.update).toHaveBeenCalledWith('custom-r1', rule);
    const busy = build({ controlCount: 1 });
    await expect(busy.service.archiveRequirement('custom-r1', actor)).rejects.toMatchObject({
      code: 'HAS_CONTROLS',
    });
  });

  it('archives a rule with no controls', async () => {
    const { service, requirements } = build();
    await service.archiveRequirement('custom-r1', actor);
    expect(requirements.setArchived).toHaveBeenCalledWith('custom-r1', expect.any(Date));
  });

  it('does not find a rule that is missing or archived', async () => {
    await expect(
      build({ rule: null }).service.updateRequirement('x', rule, actor),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    const archived = { ...ownRule, archivedAt: new Date() };
    await expect(
      build({ rule: archived }).service.archiveRequirement('custom-r1', actor),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
