import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import type { FrameworksService } from '../../frameworks/services/frameworks.service';
import type { ExportRepository } from '../repositories/export.repository';
import { ExportService } from './export.service';

const actor = { id: 'u1', label: 'Meera' };
const range = { from: '2026-04-01', to: '2026-06-30' };

function build() {
  const repository = {
    breaches: vi.fn().mockResolvedValue([]),
    requests: vi.fn().mockResolvedValue([]),
    evidence: vi.fn().mockResolvedValue([]),
    activityAfter: vi.fn().mockResolvedValue([]),
    people: vi.fn().mockResolvedValue([]),
    accounts: vi.fn().mockResolvedValue([]),
  };
  const frameworks = {
    list: vi.fn().mockResolvedValue({ frameworks: [] }),
    checklist: vi.fn(),
  };
  const activity = { record: vi.fn().mockResolvedValue(undefined) };
  const service = new ExportService(
    repository as unknown as ExportRepository,
    frameworks as unknown as FrameworksService,
    activity as unknown as ActivityService,
  );
  return { service, repository, activity };
}

describe('ExportService range', () => {
  it('cuts the lists that have a date, and says so in the activity log', async () => {
    const { service, repository, activity } = build();

    await service.csv('breaches', actor, range);
    await service.csv('requests', actor, range);
    await service.csv('evidence', actor, range);
    await service.csv('activity', actor, range);

    expect(repository.breaches).toHaveBeenCalledWith(range);
    expect(repository.requests).toHaveBeenCalledWith(range);
    expect(repository.evidence).toHaveBeenCalledWith(undefined, range);
    expect(repository.activityAfter).toHaveBeenCalledWith(null, undefined, range);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        details: { what: 'the breaches register from 2026-04-01 to 2026-06-30' },
      }),
    );
  });

  it('leaves a list with no date whole, and does not log a range for it', async () => {
    const { service, repository, activity } = build();

    await service.csv('people', actor, range);

    expect(repository.people).toHaveBeenCalledWith();
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ details: { what: 'the people list' } }),
    );
  });

  it('reads the whole list when no range is given', async () => {
    const { service, repository, activity } = build();

    await service.csv('breaches', actor);

    expect(repository.breaches).toHaveBeenCalledWith(undefined);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ details: { what: 'the breaches register' } }),
    );
  });
});
