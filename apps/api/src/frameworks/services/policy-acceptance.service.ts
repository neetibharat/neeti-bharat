import { HttpStatus, Injectable } from '@nestjs/common';
import type { MyPoliciesResponse, TeamPoliciesResponse } from '@dpdp-kit/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import { PersonDirectory } from '../../people/services/person-directory';
import { PolicyAcceptanceRepository } from '../repositories/policy-acceptance.repository';
import { toMyPolicies, toTeamPolicyRow } from '../utils/acceptance-view';

export interface TeamPoliciesQuery {
  q?: string;
  page: number;
  limit: number;
}

/** That people have read and accepted the policies that are approved. */
@Injectable()
export class PolicyAcceptanceService {
  constructor(
    private readonly acceptances: PolicyAcceptanceRepository,
    private readonly directory: PersonDirectory,
    private readonly activity: ActivityService,
  ) {}

  /** The approved policies, with where the signed-in person stands with each. */
  async mine(user: { email: string }): Promise<MyPoliciesResponse> {
    const me = await this.directory.findByEmail(user.email);
    if (!me) return { items: [], acceptedAll: false };
    return this.forPerson(me.id);
  }

  /** The approved policies, with where one person stands with each. */
  async forPerson(personId: string): Promise<MyPoliciesResponse> {
    const [policies, accepted] = await Promise.all([
      this.acceptances.approved(),
      this.acceptances.ofPeople([personId]),
    ]);
    return toMyPolicies(policies, accepted, personId);
  }

  /** One page of people with how many policies each has accepted, and how many have accepted all of them. */
  async team(query: TeamPoliciesQuery): Promise<TeamPoliciesResponse> {
    const policies = await this.acceptances.approved();
    const [{ rows, total }, everyone] = await Promise.all([
      this.directory.activePage(query),
      this.directory.activePeople(),
    ]);
    const accepted = await this.acceptances.ofPeople(everyone.map((person) => person.id));
    const complete = everyone.filter(
      (person) => toTeamPolicyRow(policies, accepted, person.id).accepted === policies.length,
    );
    return {
      people: rows.map((person) => toTeamPolicyRow(policies, accepted, person.id)),
      total,
      page: query.page,
      pageSize: query.limit,
      policies: policies.length,
      accepted: policies.length === 0 ? 0 : complete.length,
      everyone: everyone.length,
    };
  }

  /** The signed-in person accepts an approved policy. Accepting again, after it was approved anew, moves the date. */
  async accept(
    policyId: string,
    user: { email: string },
    actor: ActivityActor,
    now: Date,
  ): Promise<MyPoliciesResponse> {
    const me = await this.directory.findByEmail(user.email);
    if (!me) throw new AppException('FORBIDDEN', HttpStatus.FORBIDDEN);
    const policy = await this.acceptances.findApproved(policyId);
    if (!policy) throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    await this.acceptances.accept(policyId, me.id, now);
    await this.activity.record({
      actor,
      action: 'POLICY_ACCEPTED',
      subject: { type: 'policy', id: policy.id },
      details: { policyId: policy.id, title: policy.title },
    });
    return this.forPerson(me.id);
  }
}
