import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import type { ProfileService } from '../../profile/services/profile.service';
import type { WebsiteCheckRepository } from '../repositories/website-check.repository';
import { FetchFailure, type PageResponse } from '../utils/fetch-page';
import { WebsiteChecksService } from './website-checks.service';
import type { SiteReader } from './site-reader';

const actor = { id: 'u1', label: 'Asha' };

const home: PageResponse = {
  url: new URL('https://acme.in/'),
  status: 200,
  headers: {},
  body: 'grievance@acme.in',
  tls: { protocol: 'TLSv1.3', validTo: null },
};

function build(read: () => Promise<unknown>) {
  const checks = {
    create: vi.fn().mockImplementation(async (data) => ({
      ...data,
      id: 'w1',
      checkedAt: new Date('2026-11-11T10:00:00Z'),
    })),
    findById: vi.fn(),
    list: vi.fn(),
  };
  const activity = { record: vi.fn().mockResolvedValue(undefined) };
  const profile = {
    list: vi
      .fn()
      .mockResolvedValue({ entries: [{ key: 'grievanceEmail', value: 'grievance@acme.in' }] }),
  };
  const service = new WebsiteChecksService(
    checks as unknown as WebsiteCheckRepository,
    { read } as unknown as SiteReader,
    profile as unknown as ProfileService,
    activity as unknown as ActivityService,
  );
  return { service, checks, activity };
}

describe('WebsiteChecksService.run', () => {
  it('refuses an address it may not visit, without reading anything', async () => {
    const read = vi.fn();
    const { service, checks } = build(read);
    await expect(service.run('ftp://acme.in', actor)).rejects.toMatchObject({
      code: 'URL_NOT_ALLOWED',
      status: 400,
    });
    expect(read).not.toHaveBeenCalled();
    expect(checks.create).not.toHaveBeenCalled();
  });

  it('saves the findings with their counts and writes it to the activity log', async () => {
    const { service, checks, activity } = build(async () => ({
      home,
      httpOutcome: 'redirects_to_https',
      privacy: { url: null },
    }));
    const response = await service.run('acme.in', actor);

    expect(checks.create).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://acme.in/', checkedByName: 'Asha' }),
    );
    expect(response.results).toHaveLength(12);
    expect(response.passed + response.warned + response.failed).toBe(12);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'WEBSITE_CHECKED',
        subject: { type: 'website_check', id: 'w1' },
        details: { url: 'acme.in', passed: response.passed, total: 12 },
      }),
    );
  });

  it('keeps a site that cannot be reached as a failed finding, not an error', async () => {
    const { service } = build(async () => {
      throw new FetchFailure('dns');
    });
    const response = await service.run('https://nowhere.example', actor);
    expect(response.results).toEqual([
      { id: 'reachable', status: 'fail', values: { reason: 'dns' } },
    ]);
    expect(response.failed).toBe(1);
  });

  it('lets an unexpected failure through', async () => {
    const { service, checks } = build(async () => {
      throw new Error('boom');
    });
    await expect(service.run('acme.in', actor)).rejects.toThrow('boom');
    expect(checks.create).not.toHaveBeenCalled();
  });
});

describe('WebsiteChecksService reads', () => {
  it('reports NOT_FOUND for a check that does not exist', async () => {
    const { service, checks } = build(async () => ({}));
    checks.findById.mockResolvedValue(null);
    await expect(service.get('nope')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('lists a page of runs with the total', async () => {
    const { service, checks } = build(async () => ({}));
    checks.list.mockResolvedValue({
      rows: [
        {
          id: 'w1',
          url: 'https://acme.in/',
          checkedAt: new Date('2026-11-11T10:00:00Z'),
          checkedByName: 'Asha',
          passed: 9,
          warned: 2,
          failed: 1,
        },
      ],
      total: 11,
    });
    const list = await service.list(2, 10);
    expect(list).toMatchObject({ total: 11, page: 2, pageSize: 10 });
    expect(list.items[0]).toEqual({
      id: 'w1',
      url: 'https://acme.in/',
      checkedAt: '2026-11-11T10:00:00.000Z',
      checkedByName: 'Asha',
      passed: 9,
      warned: 2,
      failed: 1,
    });
  });
});
