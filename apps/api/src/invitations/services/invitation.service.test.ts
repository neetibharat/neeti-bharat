import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import type { UserService } from '../../users/services/user.service';
import type { MailService } from '../../core/mail/mail.service';
import type { InvitationRepository } from '../repositories/invitation.repository';
import { InvitationService } from './invitation.service';

const actor = { id: 'admin-1', label: 'Asha' };

interface Setup {
  userExists?: boolean;
  openInvitation?: boolean;
  revoked?: { email: string } | null;
  pending?: boolean;
}

function build({
  userExists = false,
  openInvitation = false,
  revoked = { email: 'a@company.in' },
  pending = true,
}: Setup) {
  const invitations = {
    create: vi.fn().mockImplementation(async (data) => ({ id: 'inv-1', ...data })),
    findOpenByEmail: vi.fn().mockResolvedValue(openInvitation ? { id: 'old' } : null),
    revoke: vi.fn().mockResolvedValue(revoked),
    findLatestPendingByEmail: vi
      .fn()
      .mockResolvedValue(pending ? { id: 'inv-old', email: 'a@company.in', role: 'member' } : null),
    renew: vi.fn().mockImplementation(async (id: string, expiresAt: Date) => ({
      id,
      email: 'a@company.in',
      role: 'member',
      expiresAt,
    })),
  } as unknown as InvitationRepository;
  const users = {
    existsByEmail: vi.fn().mockResolvedValue(userExists),
  } as unknown as UserService;
  const mail = { send: vi.fn().mockResolvedValue(undefined) } as unknown as MailService;
  const config = { get: () => 'http://localhost:3200' } as unknown as ConfigService<never, true>;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  return {
    service: new InvitationService(invitations, users, mail, config, activity),
    invitations,
    mail,
    activity,
  };
}

describe('InvitationService.create', () => {
  it('creates an invitation that expires in the future and emails the person', async () => {
    const { service, invitations, mail } = build({});
    await service.create({ email: 'a@company.in', role: 'member' }, actor);
    const [data] = vi.mocked(invitations.create).mock.calls[0] as [{ expiresAt: Date }];
    expect(data.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(mail.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@company.in' }));
  });

  it('records who invited whom', async () => {
    const { service, activity } = build({});
    await service.create({ email: 'a@company.in', role: 'member' }, actor);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        action: 'INVITATION_CREATED',
        details: { email: 'a@company.in', role: 'member' },
      }),
    );
  });

  it('refuses to invite someone who already has an account, and records nothing', async () => {
    const { service, activity } = build({ userExists: true });
    await expect(
      service.create({ email: 'a@company.in', role: 'member' }, actor),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
    });
    expect(activity.record).not.toHaveBeenCalled();
  });

  it('refuses a second open invitation for the same email', async () => {
    const { service } = build({ openInvitation: true });
    await expect(
      service.create({ email: 'a@company.in', role: 'member' }, actor),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });
});

describe('InvitationService.revoke', () => {
  it('records the cancellation', async () => {
    const { service, activity } = build({});
    await service.revoke('inv-1', actor);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'INVITATION_REVOKED', details: { email: 'a@company.in' } }),
    );
  });

  it('reports NOT_FOUND when there is nothing to cancel', async () => {
    const { service, activity } = build({ revoked: null });
    await expect(service.revoke('missing', actor)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(activity.record).not.toHaveBeenCalled();
  });
});

describe('InvitationService.resend', () => {
  it('gives the invitation a fresh last day, emails the person again and records it', async () => {
    const { service, invitations, mail, activity } = build({});
    await service.resend('a@company.in', actor);
    const [id, expiresAt] = vi.mocked(invitations.renew).mock.calls[0] as [string, Date];
    expect(id).toBe('inv-old');
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now() + 6 * 24 * 60 * 60 * 1000);
    expect(mail.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@company.in' }));
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'INVITATION_RESENT',
        details: { email: 'a@company.in', role: 'member' },
      }),
    );
  });

  it('refuses when there is no invitation to send again', async () => {
    const { service, mail } = build({ pending: false });
    await expect(service.resend('a@company.in', actor)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    expect(mail.send).not.toHaveBeenCalled();
  });

  it('refuses when the person has already signed up', async () => {
    const { service, invitations } = build({ userExists: true });
    await expect(service.resend('a@company.in', actor)).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(invitations.renew).not.toHaveBeenCalled();
  });
});
