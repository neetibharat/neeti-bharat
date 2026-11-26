import { PROFILE_FIELDS } from '@neeti-bharat/shared';
import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import type { ProfileEntry } from '../../generated/prisma/client';
import { customKeyFor } from '../utils/profile-entries';
import type { RoleHolderReader } from '../../people/services/role-holder-reader';
import type { ProfileRepository } from '../repositories/profile.repository';
import { runInOrganization } from '../../core/org/org-context';
import type { OrganizationRepository } from '../../organizations/repositories/organization.repository';
import { ProfileService } from './profile.service';

const actor = { id: 'u1', label: 'Asha' };

/** An in-memory table with the same behaviour as the real repository. */
function build(
  initial: Partial<ProfileEntry>[] = [],
  dpo: { name: string; email: string } | null = null,
) {
  const rows: ProfileEntry[] = initial.map((row, index) => ({
    id: `r${index}`,
    organizationId: 'org-1',
    key: '',
    value: '',
    label: null,
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...row,
  }));
  const repository = {
    findAll: async () => rows,
    findByKey: async (key: string) => rows.find((row) => row.key === key) ?? null,
    upsert: vi.fn(async (key: string, value: string) => {
      const existing = rows.find((row) => row.key === key);
      if (existing) existing.value = value;
      else rows.push({ id: key, key, value, label: null, isCustom: false } as ProfileEntry);
      return rows.find((row) => row.key === key)!;
    }),
    createCustom: vi.fn(async (data: { key: string; label: string; value: string }) => {
      const row = { id: data.key, ...data, isCustom: true } as ProfileEntry;
      rows.push(row);
      return row;
    }),
    deleteCustom: async (key: string) => {
      const index = rows.findIndex((row) => row.key === key && row.isCustom);
      return index < 0 ? null : rows.splice(index, 1)[0]!;
    },
  } as unknown as ProfileRepository;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  const roleHolders = { holderOf: vi.fn().mockResolvedValue(dpo) } as unknown as RoleHolderReader;
  const organizations = {
    rename: vi.fn().mockResolvedValue(undefined),
  } as unknown as OrganizationRepository;
  return {
    service: new ProfileService(repository, activity, roleHolders, organizations),
    repository,
    activity,
    organizations,
  };
}

describe('ProfileService.update of the company name', () => {
  it('renames the organisation to match', async () => {
    const { service, organizations } = build();
    await runInOrganization('org-1', () =>
      service.update('companyName', { value: ' Acme Pvt Ltd ' }, actor),
    );
    expect(organizations.rename).toHaveBeenCalledWith('org-1', 'Acme Pvt Ltd');
  });

  it('keeps the organisation name when the answer is emptied', async () => {
    const { service, organizations } = build([{ key: 'companyName', value: 'Acme' }]);
    await runInOrganization('org-1', () => service.update('companyName', { value: '' }, actor));
    expect(organizations.rename).not.toHaveBeenCalled();
  });

  it('leaves the name alone when any other answer changes', async () => {
    const { service, organizations } = build();
    await runInOrganization('org-1', () =>
      service.update('website', { value: 'https://acme.in' }, actor),
    );
    expect(organizations.rename).not.toHaveBeenCalled();
  });
});

describe('ProfileService.list', () => {
  it('shows every built-in answer with its default until it is changed', async () => {
    const { service } = build();
    const { entries } = await service.list();
    expect(entries).toHaveLength(PROFILE_FIELDS.length);
    expect(entries.find((entry) => entry.key === 'breachReportWindow')).toMatchObject({
      value: '72 hours',
      isDefault: true,
      requiresConfirmation: true,
    });
  });

  it('shows a changed answer, and the answers people added at the end', async () => {
    const { service } = build([
      { key: 'dpoEmail', value: 'dpo@company.in' },
      { key: 'custom:office', value: 'MG Road', label: 'Office', isCustom: true },
    ]);
    const { entries } = await service.list();
    expect(entries.find((entry) => entry.key === 'dpoEmail')).toMatchObject({
      value: 'dpo@company.in',
      isDefault: false,
    });
    expect(entries.at(-1)).toMatchObject({ key: 'custom:office', label: 'Office', isCustom: true });
  });
});

describe('ProfileService.update', () => {
  it('saves a change and records the value before and after', async () => {
    const { service, activity } = build();
    await service.update('dpoEmail', { value: 'dpo@company.in' }, actor);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PROFILE_UPDATED',
        details: { key: 'dpoEmail' },
        before: { value: '' },
        after: { value: 'dpo@company.in' },
      }),
    );
  });

  it('refuses an answer that does not look right', async () => {
    const { service, repository } = build();
    await expect(service.update('dpoEmail', { value: 'nope' }, actor)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it('refuses a vague duration, so deadlines can always be worked out', async () => {
    const { service } = build();
    await expect(
      service.update('breachReportWindow', { value: 'soon', confirmed: true }, actor),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('needs a confirmation to change a legal limit, and saves nothing without it', async () => {
    const { service, repository, activity } = build();
    await expect(
      service.update('breachReportWindow', { value: '48 hours' }, actor),
    ).rejects.toMatchObject({ code: 'CONFIRMATION_REQUIRED' });
    expect(repository.upsert).not.toHaveBeenCalled();
    expect(activity.record).not.toHaveBeenCalled();
  });

  it('changes a legal limit once confirmed, and records it', async () => {
    const { service, activity } = build();
    await service.update('breachReportWindow', { value: '48 hours', confirmed: true }, actor);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ before: { value: '72 hours' }, after: { value: '48 hours' } }),
    );
  });

  it('does nothing, and records nothing, when the answer has not changed', async () => {
    const { service, repository, activity } = build();
    await service.update('languagesOffered', { value: 'English' }, actor);
    expect(repository.upsert).not.toHaveBeenCalled();
    expect(activity.record).not.toHaveBeenCalled();
  });

  it('says NOT_FOUND for a key that is not an answer', async () => {
    const { service } = build();
    await expect(service.update('nonsense', { value: 'x' }, actor)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    await expect(service.update('custom:missing', { value: 'x' }, actor)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('answers people add', () => {
  it('adds one under a readable key and records it', async () => {
    const { service, activity } = build();
    const entry = await service.addCustom({ label: 'Office address', value: 'MG Road' }, actor);
    expect(entry).toMatchObject({ key: 'custom:office-address', isCustom: true });
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PROFILE_ENTRY_ADDED',
        details: { key: 'custom:office-address', label: 'Office address' },
      }),
    );
  });

  it('refuses a name already used, and a name with nothing to make a key from', async () => {
    const { service } = build([
      { key: 'custom:office-address', isCustom: true, label: 'Office address' },
    ]);
    await expect(
      service.addCustom({ label: 'Office address', value: 'x' }, actor),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(service.addCustom({ label: '!!!', value: 'x' }, actor)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
  });

  it('removes one it added, and never a built-in answer', async () => {
    const { service, activity } = build([
      { key: 'custom:office', isCustom: true, label: 'Office', value: 'MG Road' },
      { key: 'dpoEmail', value: 'dpo@company.in' },
    ]);
    await service.removeCustom('custom:office', actor);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROFILE_ENTRY_REMOVED', before: { value: 'MG Road' } }),
    );
    await expect(service.removeCustom('dpoEmail', actor)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('customKeyFor', () => {
  it('makes a short, lowercase, dashed key', () => {
    expect(customKeyFor('  Office Address (HQ)! ')).toBe('custom:office-address-hq');
    expect(customKeyFor('???')).toBe('');
  });
});

describe('the DPO answers', () => {
  const dpo = { name: 'Priya Sharma', email: 'priya@company.in' };

  it('come from whoever holds the DPO role, so they cannot disagree with it', async () => {
    const { service } = build([{ key: 'dpoName', value: 'Someone typed this' }], dpo);
    const { entries } = await service.list();
    expect(entries.find((entry) => entry.key === 'dpoName')).toMatchObject({
      value: 'Priya Sharma',
      isDerived: true,
    });
    expect(entries.find((entry) => entry.key === 'dpoEmail')).toMatchObject({
      value: 'priya@company.in',
      isDerived: true,
    });
  });

  it('can be typed by hand only while the role is vacant', async () => {
    const vacant = build();
    await expect(vacant.service.update('dpoName', { value: 'Asha' }, actor)).resolves.toBeDefined();
    const assigned = build([], dpo);
    await expect(
      assigned.service.update('dpoName', { value: 'Asha' }, actor),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });
});
