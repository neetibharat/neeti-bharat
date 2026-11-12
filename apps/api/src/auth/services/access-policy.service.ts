import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../core/config/env.validation';
import { InvitationService } from '../../invitations/services/invitation.service';
import { UserService } from '../../users/services/user.service';
import { InvitedMembersService } from './invited-members.service';

export type SignInDecision = { allowed: true } | { allowed: false };

/**
 * Who may sign in: the first person (only the configured email when `INITIAL_ADMIN_EMAIL` is set), people who
 * already have an account, and people with an invitation to any organisation.
 */
@Injectable()
export class AccessPolicyService {
  constructor(
    private readonly users: UserService,
    private readonly invitations: InvitationService,
    private readonly members: InvitedMembersService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async decide(email: string): Promise<SignInDecision> {
    if ((await this.users.countAll()) === 0 && this.mayClaimInstall(email))
      return { allowed: true };
    if (await this.users.findAnywhere(email)) return { allowed: true };
    if ((await this.invitations.findOpenAnywhere(email)).length > 0) return { allowed: true };
    return { allowed: false };
  }

  /** Without a configured address anyone may (development); with one, only that address. */
  private mayClaimInstall(email: string): boolean {
    const owner = this.config.get('INITIAL_ADMIN_EMAIL', { infer: true });
    return !owner || owner.toLowerCase() === email.toLowerCase();
  }

  /** Takes up every open invitation to this person, when a session of theirs starts. See `InvitedMembersService`. */
  async joinInvitedFor(userId: string): Promise<void> {
    const account = await this.users.findById(userId);
    if (account) await this.members.join(account);
  }
}
