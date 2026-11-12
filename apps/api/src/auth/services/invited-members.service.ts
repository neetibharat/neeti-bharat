import { Injectable } from '@nestjs/common';
import { ActivityService } from '../../activity/services/activity.service';
import { runInOrganization } from '../../core/org/org-context';
import { InvitationService } from '../../invitations/services/invitation.service';
import { MembershipRepository } from '../../organizations/repositories/membership.repository';
import { PeopleService } from '../../people/services/people.service';

export interface NewAccount {
  id: string;
  email: string;
  name: string;
}

/**
 * Takes up the invitations a person has: they become a member of each organisation that invited them, with the role
 * given, and each organisation's log records it. Runs when an account is made, and again whenever someone who already
 * has an account is invited to another organisation.
 */
@Injectable()
export class InvitedMembersService {
  constructor(
    private readonly invitations: InvitationService,
    private readonly memberships: MembershipRepository,
    private readonly people: PeopleService,
    private readonly activity: ActivityService,
  ) {}

  async join(account: NewAccount): Promise<void> {
    for (const invitation of await this.invitations.findOpenAnywhere(account.email)) {
      await runInOrganization(invitation.organizationId, async () => {
        await this.memberships.join(invitation.organizationId, account.id, invitation.role);
        await this.people.ensureForAccount({ email: account.email, name: account.name });
        await this.invitations.markAccepted(invitation.id);
        await this.activity.record({
          actor: { id: account.id, label: account.email },
          action: 'USER_CREATED',
          subject: { type: 'user', id: account.id },
          details: { email: account.email, role: invitation.role },
        });
      });
    }
  }
}
