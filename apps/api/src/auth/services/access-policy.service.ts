import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppRole } from '@dpdp-kit/shared';
import { ActivityService } from '../../activity/services/activity.service';
import { InvitationService } from '../../invitations/services/invitation.service';
import type { Env } from '../../core/config/env.validation';
import { PeopleService } from '../../people/services/people.service';
import { UserService } from '../../users/services/user.service';

export type SignInDecision =
  { allowed: true; role: AppRole; isNewUser: boolean } | { allowed: false };

/**
 * Who may sign in: the first person (as admin; only the configured email when `INITIAL_ADMIN_EMAIL` is set), people with an account that is still on, and invited people. */
@Injectable()
export class AccessPolicyService {
  constructor(
    private readonly users: UserService,
    private readonly invitations: InvitationService,
    private readonly activity: ActivityService,
    private readonly people: PeopleService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async decide(email: string): Promise<SignInDecision> {
    if ((await this.users.count()) === 0 && this.mayClaimInstall(email)) {
      return { allowed: true, role: 'admin', isNewUser: true };
    }
    const account = await this.users.findByEmail(email);
    if (account) {
      return account.disabledAt
        ? { allowed: false }
        : { allowed: true, role: account.role, isNewUser: false };
    }
    const invitation = await this.invitations.findOpenByEmail(email);
    if (!invitation) return { allowed: false };
    return { allowed: true, role: invitation.role, isNewUser: true };
  }

  /** Without a configured address anyone may (development); with one, only that address. */
  private mayClaimInstall(email: string): boolean {
    const owner = this.config.get('INITIAL_ADMIN_EMAIL', { infer: true });
    return !owner || owner.toLowerCase() === email.toLowerCase();
  }

  /** True for someone who has left. Checked before every new session, whichever way they sign in. */
  isDisabled(userId: string): Promise<boolean> {
    return this.users.isDisabled(userId);
  }

  /** Runs once a new account exists: makes sure they are a person, closes their invitation, records the account. */
  async onUserCreated(user: {
    id: string;
    email: string;
    name: string;
    role: string;
  }): Promise<void> {
    await this.people.ensureForAccount({ email: user.email, name: user.name });
    await this.invitations.markAccepted(user.email);
    await this.activity.record({
      actor: { id: user.id, label: user.email },
      action: 'USER_CREATED',
      subject: { type: 'user', id: user.id },
      details: { email: user.email, role: user.role },
    });
  }
}
