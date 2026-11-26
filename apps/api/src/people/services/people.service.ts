import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  AddPersonRequest,
  PeopleListResponse,
  PersonOptionsResponse,
  PersonResponse,
  RoleHoldersResponse,
} from '@neeti-bharat/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { UserService } from '../../users/services/user.service';
import { AppException } from '../../core/common/app.exception';
import { InvitationService } from '../../invitations/services/invitation.service';
import type { ListPeopleQuery, UpdatePersonInput } from '../dto/people.dto';
import { toPersonResponses, toRoleHolders } from '../utils/person-mapper';
import { PeopleRepository, type PersonWithRoles } from '../repositories/people.repository';

@Injectable()
export class PeopleService {
  constructor(
    private readonly people: PeopleRepository,
    private readonly users: UserService,
    private readonly invitations: InvitationService,
    private readonly activity: ActivityService,
  ) {}

  /** One page of people, plus head counts that do not change with the page or the search. */
  async list(query: ListPeopleQuery): Promise<PeopleListResponse> {
    const [{ rows, total }, byStatus, activeAccounts, openInvitations] = await Promise.all([
      this.people.findPage(query),
      this.people.countByStatus(),
      this.users.countActive(),
      this.invitations.countOpen(),
    ]);
    return {
      people: await this.withAccess(rows),
      total,
      page: query.page,
      pageSize: query.limit,
      counts: { ...byStatus, withLogin: activeAccounts + openInvitations },
    };
  }

  /** Active people as id and name only, for pickers. */
  async options(): Promise<PersonOptionsResponse> {
    return { people: await this.people.activeOptions() };
  }

  /** Who holds each job. */
  async roleHolders(): Promise<RoleHoldersResponse> {
    return { roleHolders: toRoleHolders(await this.people.assignments()) };
  }

  async add(
    input: AddPersonRequest,
    actor: ActivityActor & { id: string },
  ): Promise<PersonResponse> {
    const email = input.email.toLowerCase();
    if (await this.people.findByEmail(email))
      throw new AppException('CONFLICT', HttpStatus.CONFLICT);

    // Only the fields a person has: `access` lives on their account or invitation, not here.
    const person = await this.people.create({
      name: input.name,
      email,
      department: input.department,
      jobTitle: input.jobTitle,
    });
    await this.invitations.create({ email, role: input.access }, actor);
    await this.activity.record({
      actor,
      action: 'PERSON_ADDED',
      subject: { type: 'person', id: person.id },
      details: { name: person.name, email, access: input.access },
    });
    return this.one(person.id);
  }

  async update(
    id: string,
    input: UpdatePersonInput,
    actor: ActivityActor,
  ): Promise<PersonResponse> {
    const person = await this.people.findById(id);
    if (!person) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);

    const updated = await this.people.update(id, input);
    await this.activity.record({
      actor,
      action: 'PERSON_UPDATED',
      subject: { type: 'person', id },
      details: { name: updated.name, email: updated.email },
    });
    return this.one(id);
  }

  /** Sends someone's invitation again, with a fresh last day. */
  async resendInvitation(
    id: string,
    actor: ActivityActor & { id: string },
  ): Promise<PersonResponse> {
    const person = await this.people.findById(id);
    if (!person) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    if (person.status === 'left') throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    await this.invitations.resend(person.email, actor);
    return this.one(id);
  }

  /** Called when an account is created, so everyone who can sign in is also a person. */
  async ensureForAccount(account: { email: string; name: string }): Promise<void> {
    const name = account.name || account.email.split('@')[0] || account.email;
    await this.people.ensure({ name, email: account.email });
  }

  /** One person, whether they work here or have left. */
  async get(id: string): Promise<PersonResponse> {
    if (!(await this.people.findById(id)))
      throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    return this.one(id);
  }

  private async one(id: string): Promise<PersonResponse> {
    const person = (await this.people.findWithRoles(id))!;
    return (await this.withAccess([person]))[0]!;
  }

  private async withAccess(persons: PersonWithRoles[]): Promise<PersonResponse[]> {
    const emails = persons.map((person) => person.email);
    const [accounts, invitations] = await Promise.all([
      this.users.findByEmails(emails),
      this.invitations.findPendingByEmails(emails),
    ]);
    return toPersonResponses(persons, accounts, invitations);
  }
}
