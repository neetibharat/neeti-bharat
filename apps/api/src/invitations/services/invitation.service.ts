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

  countOpen(): Promise<number> {
    return this.invitations.countOpen(new Date());
  }

  /** Closes the open invitations of someone who has just created their account. */
  markAccepted(email: string): Promise<void> {
    return this.invitations.markAccepted(email, new Date());
  }

  async create(input: InviteInput, actor: Actor): Promise<Invitation> {
    await this.assertCanInvite(input.email);
    const invitation = await this.invitations.create({
      ...input,
      invitedById: actor.id,
      expiresAt: new Date(Date.now() + INVITATION_DAYS * DAY_MS),
    });
    await this.activity.record({
      actor,
      action: 'INVITATION_CREATED',
      subject: { type: 'invitation', id: invitation.id },
      details: { email: invitation.email, role: invitation.role },
    });
    await this.sendInvitationEmail(invitation);
    return invitation;
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

  private sendInvitationEmail(invitation: Invitation): Promise<void> {
    const url = this.config.get('WEB_ORIGIN', { infer: true });
    return this.mail.send({
      to: invitation.email,
      ...renderMail('en', 'invitation', { url, days: INVITATION_DAYS }),
    });
  }
}
