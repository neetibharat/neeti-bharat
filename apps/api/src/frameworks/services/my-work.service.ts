import { Injectable } from '@nestjs/common';
import type { MyWorkItem, MyWorkResponse, MyWorkTeamResponse } from '@dpdp-kit/shared';
import { currentRole } from '../../core/org/org-context';
import { OpenBreachReader } from '../../breaches/services/open-breach-reader';
import { OpenRequestReader } from '../../requests/services/open-request-reader';
import { PersonDirectory } from '../../people/services/person-directory';
import { ControlRepository } from '../repositories/control.repository';
import { PolicyRepository } from '../repositories/policy.repository';
import { myWorkItems, workloadOf } from '../utils/my-work';

/** What is waiting on a person: breaches and requests to deal with, proof to collect, policies to approve, review or write. */
@Injectable()
export class MyWorkService {
  constructor(
    private readonly controls: ControlRepository,
    private readonly policies: PolicyRepository,
    private readonly directory: PersonDirectory,
    private readonly breaches: OpenBreachReader,
    private readonly requests: OpenRequestReader,
  ) {}

  async forUser(user: { email: string }): Promise<MyWorkResponse> {
    const me = await this.directory.findByEmail(user.email);
    if (!me) return { items: [] };
    return { items: await this.itemsFor(me.id, currentRole() === 'admin') };
  }

  /** What is waiting on someone else, for an admin who wants to see how work is split. */
  async forPerson(personId: string): Promise<MyWorkResponse> {
    return { items: await this.itemsFor(personId, false) };
  }

  /** How much is waiting on each person who has not left. Everything is read once, then worked out per person. */
  async team(): Promise<MyWorkTeamResponse> {
    const [people, rolesOf, snapshot] = await Promise.all([
      this.directory.activePeople(),
      this.directory.rolesByPerson(),
      this.snapshot(),
    ]);
    return {
      members: people.map((person) =>
        workloadOf(
          person.id,
          this.itemsOf(snapshot, person.id, rolesOf.get(person.id) ?? new Set(), false),
        ),
      ),
    };
  }

  private async itemsFor(personId: string, isAdmin: boolean): Promise<MyWorkItem[]> {
    const [snapshot, roles] = await Promise.all([
      this.snapshot(),
      this.directory.rolesHeldBy(personId),
    ]);
    return this.itemsOf(snapshot, personId, new Set(roles), isAdmin);
  }

  /** The controls, policies, open breaches and open requests the work is worked out from. */
  private async snapshot() {
    const [controls, policies, breaches, requests] = await Promise.all([
      this.controls.findActive(),
      this.policies.findActive(),
      this.breaches.open(),
      this.requests.open(),
    ]);
    return {
      controls,
      policies,
      breaches,
      requests,
      briefs: new Map(policies.map((policy) => [policy.id, policy])),
    };
  }

  private itemsOf(
    snapshot: Awaited<ReturnType<MyWorkService['snapshot']>>,
    personId: string,
    roles: ReadonlySet<string>,
    isAdmin: boolean,
  ): MyWorkItem[] {
    return myWorkItems({ personId, roles, isAdmin, ...snapshot, now: new Date() });
  }
}
