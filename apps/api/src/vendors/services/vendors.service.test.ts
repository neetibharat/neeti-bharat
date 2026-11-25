import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import type { PersonDirectory } from '../../people/services/person-directory';
import type { VendorRepository, VendorRow } from '../repositories/vendor.repository';
import { VendorsService } from './vendors.service';

const actor = { id: 'u1', label: 'Asha' };
const now = new Date('2026-11-20T10:30:00.000Z');

const stored = (over: Partial<VendorRow> = {}): VendorRow =>
  ({
    id: 'v1',
    name: 'Acme Payroll',
    website: null,
    service: 'Runs payroll',
    category: 'hr',
    dataKinds: ['name'],
    location: 'india',
    status: 'not_assessed',
    agreementUrl: null,
    nextReviewOn: null,
    inherentLikelihood: null,
    inherentImpact: null,
    residualLikelihood: null,
    residualImpact: null,
    treatment: null,
    treatmentNote: null,
    ownerId: null,
    owner: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    organizationId: 'o1',
    ...over,
  }) as VendorRow;

function build(found: VendorRow | null = stored(), nameTaken = false) {
  const vendors = {
    findPage: vi.fn().mockResolvedValue({ rows: [stored()], total: 1 }),
    counts: vi.fn().mockResolvedValue({ active: 1, attention: 1, archived: 0 }),
    findById: vi.fn().mockResolvedValue(found),
    findByName: vi.fn().mockResolvedValue(nameTaken ? stored({ id: 'other' }) : null),
    create: vi.fn().mockImplementation(async () => stored()),
    update: vi.fn().mockImplementation(async () => stored()),
    setArchived: vi
      .fn()
      .mockImplementation(async (_id: string, at: Date | null) => stored({ archivedAt: at })),
  } as unknown as VendorRepository;
  const directory = {
    requireActive: vi.fn(async (id: string) => {
      if (id !== 'p1') throw new AppException('VALIDATION_FAILED', 400);
      return { id, name: 'Ravi' };
    }),
  } as unknown as PersonDirectory;
  const activity = {
    record: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 10 }),
  } as unknown as ActivityService;
  return { service: new VendorsService(vendors, directory, activity), vendors, activity };
}

const input = {
  name: 'Acme Payroll',
  service: 'Runs payroll',
  category: 'hr' as const,
  status: 'not_assessed' as const,
  dataKinds: ['name' as const],
  location: 'india' as const,
  nextReviewOn: '2026-12-01',
  inherent: { likelihood: 2 as const, impact: 4 as const },
};

describe('VendorsService.list', () => {
  it('gives a page with the counts, comparing dates with the start of today', async () => {
    const { service, vendors } = build();
    const result = await service.list({ tab: 'attention', page: 1, limit: 25 }, now);
    expect(result).toMatchObject({ total: 1, page: 1, pageSize: 25 });
    expect(result.counts).toEqual({ active: 1, attention: 1, archived: 0 });
    const today = new Date('2026-11-20T00:00:00.000Z');
    expect(vendors.findPage).toHaveBeenCalledWith(expect.objectContaining({ today }));
    expect(vendors.counts).toHaveBeenCalledWith(today);
  });
});

describe('VendorsService.add', () => {
  it('stores the day as a moment and the rating as two columns, and records it', async () => {
    const { service, vendors, activity } = build();
    await service.add(input, actor, now);
    expect(vendors.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nextReviewOn: new Date('2026-12-01T00:00:00.000Z'),
        inherentLikelihood: 2,
        inherentImpact: 4,
      }),
    );
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'VENDOR_ADDED', details: { name: 'Acme Payroll' } }),
    );
  });

  it('refuses a name that is taken, and an owner who is not at the company', async () => {
    await expect(build(stored(), true).service.add(input, actor, now)).rejects.toMatchObject({
      code: 'CONFLICT',
    });
    await expect(
      build().service.add({ ...input, ownerId: 'gone' }, actor, now),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});

describe('VendorsService.get', () => {
  it('gives one vendor, and says when it is not there', async () => {
    expect((await build().service.get('v1', now)).name).toBe('Acme Payroll');
    await expect(build(null).service.get('v1', now)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('VendorsService.activityOf', () => {
  it('reads only the events about that vendor', async () => {
    const { service, activity } = build();
    await service.activityOf('v1', 1, 10);
    expect(activity.list).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      subject: { type: 'vendor', id: 'v1' },
    });
  });
});

describe('VendorsService.update', () => {
  it('empties what is sent as null and leaves what was not sent', async () => {
    const { service, vendors } = build();
    await service.update('v1', { nextReviewOn: null, residual: null }, actor, now);
    const changes = vi.mocked(vendors.update).mock.calls[0]![1];
    expect(changes).toEqual({
      nextReviewOn: null,
      residualLikelihood: null,
      residualImpact: null,
    });
  });

  it('stores the decision about the risk, and empties the reason when it is cleared', async () => {
    const { service, vendors } = build();
    await service.update('v1', { treatment: 'transfer', treatmentNote: null }, actor, now);
    expect(vi.mocked(vendors.update).mock.calls[0]![1]).toEqual({
      treatment: 'transfer',
      treatmentNote: null,
    });
  });

  it('stores a rating as its two ends', async () => {
    const { service, vendors } = build();
    await service.update('v1', { inherent: { likelihood: 3, impact: 5 } }, actor, now);
    expect(vi.mocked(vendors.update).mock.calls[0]![1]).toEqual({
      inherentLikelihood: 3,
      inherentImpact: 5,
    });
  });

  it('does not touch an archived vendor or one that is not there', async () => {
    await expect(
      build(stored({ archivedAt: now })).service.update('v1', { service: 'x' }, actor, now),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(build(null).service.update('v1', {}, actor, now)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('VendorsService.archive and restore', () => {
  it('archives a vendor in use and restores an archived one, each recorded', async () => {
    const { service, activity } = build();
    await service.archive('v1', actor, now);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'VENDOR_ARCHIVED' }),
    );
    const archived = build(stored({ archivedAt: now }));
    await archived.service.restore('v1', actor, now);
    expect(archived.activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'VENDOR_RESTORED' }),
    );
  });

  it('refuses to archive twice or restore what is in use', async () => {
    await expect(
      build(stored({ archivedAt: now })).service.archive('v1', actor, now),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(build().service.restore('v1', actor, now)).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });
});
