import { HttpStatus, Injectable } from '@nestjs/common';
import type { AppRole, LeaveResponse } from '@dpdp-kit/shared';
import { ActivityService } from '../../activity/services/activity.service';
import type { Account } from '../../users/repositories/user.repository';
import { UserService } from '../../users/services/user.service';
import type { Actor } from '../../core/common/actor';
import { AppException } from '../../core/common/app.exception';
import type { Person } from '../../generated/prisma/client';
import { InvitationService } from '../../invitations/services/invitation.service';
import { accessOf } from '../utils/person-mapper';
import { PeopleRepository } from '../repositories/people.repository';

/** Changing what a person can do, and ending it when they leave. Everything here touches their login. */
@Injectable()
export class AccessChangeService {
  constructor(
    private readonly people: PeopleRepository,
    private readonly users: UserService,
    private readonly invitations: InvitationService,
    private readonly activity: ActivityService,
  ) {}

  async setAccess(personId: string, target: AppRole, actor: Actor): Promise<void> {
    const person = await this.activePerson(personId);
    const account = await this.users.findByEmail(person.email);
    const invitation = await this.invitations.findOpenByEmail(person.email);
    const current = accessOf(account, invitation).access;
    if (current === target) return;

    if (account) await this.changeAccount(account, target);
    else await this.changeInvitation(person, invitation?.id, target, actor);

    await this.activity.record({
      actor,
      action: 'ACCESS_CHANGED',
      subject: { type: 'person', id: personId },
      details: { name: person.name, from: current, to: target },
    });
  }

  /**
   * Marks someone as left. Their login is cut first and at once: sessions end, they cannot sign in
   * again, and any open invitation is cancelled. Their roles become vacant.
   */
  async leave(personId: string, actor: Actor): Promise<LeaveResponse> {
    const person = await this.people.findById(personId);
    if (!person) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    if (person.status === 'left') return { releasedRoles: [], releasedAssignments: 0 };

    const account = await this.users.findByEmail(person.email);
    if (account && !account.disabledAt) await this.disableLogin(account);
    const invitation = await this.invitations.findOpenByEmail(person.email);
    if (invitation) await this.invitations.revoke(invitation.id, actor);

    const outcome = await this.people.markLeft(personId, new Date());
    await this.activity.record({
      actor,
      action: 'PERSON_LEFT',
      subject: { type: 'person', id: personId },
      details: { name: person.name, email: person.email },
    });
    return { releasedRoles: outcome.roles, releasedAssignments: outcome.assignments };
  }

  private async activePerson(id: string): Promise<Person> {
    const person = await this.people.findById(id);
    if (!person) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    if (person.status === 'left') throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    return person;
  }

  private async changeAccount(account: Account, target: AppRole): Promise<void> {
    const losesAdmin = account.role === 'admin' && !account.disabledAt && target !== 'admin';
    if (losesAdmin) await this.assertNotLastAdmin();
    await this.users.setRole(account.id, target);
  }

  /** Nobody has signed in yet, so the change is a new invitation in place of the old one. */
  private async changeInvitation(
    person: Person,
    openInvitationId: string | undefined,
    target: AppRole,
    actor: Actor,
  ): Promise<void> {
    if (openInvitationId) await this.invitations.revoke(openInvitationId, actor);
    await this.invitations.create({ email: person.email, role: target }, actor);
  }

  private async disableLogin(account: Account): Promise<void> {
    if (account.role === 'admin') await this.assertNotLastAdmin();
    await this.users.disable(account.id, new Date());
  }

  /** Without an admin nobody could manage the install, so the last one can never be removed or demoted. */
  private async assertNotLastAdmin(): Promise<void> {
    if ((await this.users.countActiveAdmins()) <= 1) {
      throw new AppException('LAST_ADMIN', HttpStatus.CONFLICT);
    }
  }
}
