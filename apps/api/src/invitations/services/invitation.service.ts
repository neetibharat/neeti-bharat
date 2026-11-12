import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActivityService } from '../../activity/services/activity.service';
import type { Actor } from '../../core/common/actor';
import { AppException } from '../../core/common/app.exception';
import type { Env } from '../../core/config/env.validation';
import { MailService } from '../../core/mail/mail.service';
import { renderMail } from '../../core/mail/templates';
import type { AppRole, Invitation } from '../../generated/prisma/client';
import { UserService } from '../../users/services/user.service';
import { InvitationRepository } from '../repositories/invitation.repository';

export interface InviteInput {
  email: string;
  role: AppRole;
}

const INVITATION_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const newExpiry = (): Date => new Date(Date.now() + INVITATION_DAYS * DAY_MS);

@Injectable()
export class InvitationService {
  constructor(
    private readonly invitations: InvitationRepository,
    private readonly users: UserService,
    private readonly mail: MailService,
    private readonly config: ConfigService<Env, true>,
    private readonly activity: ActivityService,
  ) {}

  /** The latest open invitation for this email, if any. */
  findOpenByEmail(email: string): Promise<Invitation | null> {
    return this.invitations.findOpenByEmail(email, new Date());
  }

  /** Open invitations for these emails, newest first, so the latest one for an email wins. */
  findOpenByEmails(emails: string[]): Promise<Invitation[]> {
    return this.invitations.findOpenByEmails(emails, new Date());
  }

  /** Invitations still waiting for an answer, including ones that have run out, newest first. */
  findPendingByEmails(emails: string[]): Promise<Invitation[]> {
    return this.invitations.findPendingByEmails(emails);
  }

  countOpen(): Promise<number> {
    return this.invitations.countOpen(new Date());
  }

  /** Every open invitation to this email, from any organisation. Used at sign-in, before anyone has an organisation. */
  findOpenAnywhere(email: string): Promise<Invitation[]> {
    return this.invitations.findOpenAnywhere(email, new Date());
  }

  /** Closes an invitation once the person has joined. */
  markAccepted(id: string): Promise<void> {
    return this.invitations.markAccepted(id, new Date());
  }

  async create(input: InviteInput, actor: Actor): Promise<Invitation> {
    await this.assertCanInvite(input.email);
    const invitation = await this.invitations.create({
      ...input,
      invitedById: actor.id,
      expiresAt: newExpiry(),
    });
    await this.activity.record({
      actor,
      action: 'INVITATION_CREATED',
      subject: { type: 'invitation', id: invitation.id },
      details: { email: invitation.email, role: invitation.role },
    });
    await this.sendInvitationEmail(invitation, actor.label);
    return invitation;
  }

  /** Sends the same invitation again with a fresh last day. It needs an invitation nobody has answered yet. */
  async resend(email: string, actor: Actor): Promise<Invitation> {
    const pending = await this.invitations.findLatestPendingByEmail(email);
    if (!pending) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    if (await this.users.existsByEmail(email))
      throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    const renewed = await this.invitations.renew(pending.id, newExpiry());
    await this.activity.record({
      actor,
      action: 'INVITATION_RESENT',
      subject: { type: 'invitation', id: renewed.id },
      details: { email: renewed.email, role: renewed.role },
    });
    await this.sendInvitationEmail(renewed, actor.label);
    return renewed;
  }

  async revoke(id: string, actor: Actor): Promise<void> {
    const revoked = await this.invitations.revoke(id);
    if (!revoked) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    await this.activity.record({
      actor,
      action: 'INVITATION_REVOKED',
      subject: { type: 'invitation', id },
      details: { email: revoked.email },
    });
  }

  private async assertCanInvite(email: string): Promise<void> {
    const taken =
      (await this.users.existsByEmail(email)) ||
      (await this.invitations.findOpenByEmail(email, new Date()));
    if (taken) throw new AppException('CONFLICT', HttpStatus.CONFLICT);
  }

  private async sendInvitationEmail(invitation: Invitation, inviter: string): Promise<void> {
    await this.mail.send({
      to: invitation.email,
      ...renderMail('en', 'invitation', {
        url: this.config.get('WEB_ORIGIN', { infer: true }),
        days: INVITATION_DAYS,
        organization: await this.invitations.organizationName(),
        inviter,
        role: invitation.role,
      }),
    });
  }
}
