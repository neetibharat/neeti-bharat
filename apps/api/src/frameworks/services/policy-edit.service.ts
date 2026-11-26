import { Injectable } from '@nestjs/common';
import type { PolicyDetailResponse, PolicyListResponse } from '@neeti-bharat/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { activeOrNotFound, archivedOrNotFound } from '../../core/common/active';
import { newCustomId } from '../../core/common/ids';
import type { CreatePolicyInput, SavePolicyInput } from '../dto/policy.dto';
import { PolicyRepository } from '../repositories/policy.repository';
import { aboutPolicy } from '../utils/activity-subjects';
import { policyView } from '../utils/policy-view';
import { PoliciesService, type PolicyActor } from './policies.service';
import { RuleReader } from './rule-reader';

/** The company's own changes to its policies: add, edit the details, archive and bring back. */
@Injectable()
export class PolicyEditService {
  constructor(
    private readonly policies: PolicyRepository,
    private readonly activity: ActivityService,
    private readonly rules: RuleReader,
    private readonly reader: PoliciesService,
  ) {}

  async archived(): Promise<PolicyListResponse> {
    const rows = await this.policies.findArchived();
    return { policies: rows.map(policyView) };
  }

  async create(input: CreatePolicyInput, actor: PolicyActor): Promise<PolicyDetailResponse> {
    await this.rules.framework(input.frameworkId);
    const id = newCustomId();
    await this.policies.create({ id, ...input }, actor.label);
    await this.activity.record({
      actor,
      action: 'POLICY_CREATED',
      ...aboutPolicy({ id, title: input.title }),
    });
    return this.reader.detail(id, actor);
  }

  async save(
    id: string,
    input: SavePolicyInput,
    actor: PolicyActor,
  ): Promise<PolicyDetailResponse> {
    const policy = activeOrNotFound(await this.policies.findOne(id));
    const changed =
      policy.title !== input.title ||
      policy.summary !== input.summary ||
      policy.ownerRole !== input.ownerRole ||
      policy.approverTitle !== input.approverTitle;
    if (changed) {
      await this.policies.saveDetails(id, input);
      await this.activity.record({
        actor,
        action: 'POLICY_DETAILS_EDITED',
        ...aboutPolicy({ id, title: input.title }),
      });
    }
    return this.reader.detail(id, actor);
  }

  async archive(id: string, actor: ActivityActor): Promise<void> {
    const policy = activeOrNotFound(await this.policies.findOne(id));
    await this.policies.setArchived(id, new Date());
    await this.activity.record({ actor, action: 'POLICY_ARCHIVED', ...aboutPolicy(policy) });
  }

  async restore(id: string, actor: ActivityActor): Promise<void> {
    const policy = archivedOrNotFound(await this.policies.findOne(id));
    await this.policies.setArchived(id, null);
    await this.activity.record({ actor, action: 'POLICY_RESTORED', ...aboutPolicy(policy) });
  }
}
