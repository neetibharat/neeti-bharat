import { HttpStatus, Injectable } from '@nestjs/common';
import {
  markdownToDocument,
  POLICY_TEXTS,
  POLICY_TRANSITIONS,
  policyTemplate,
  starterDocument,
  tokenKeys,
  transitionNeedsAdmin,
  type ActivityAction,
  type PolicyDetailResponse,
  type PolicyDocument,
  type PolicyListResponse,
  type PolicyStatus,
  type PolicyVersionResponse,
} from '@neeti-bharat/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { activeOrNotFound } from '../../core/common/active';
import { AppException } from '../../core/common/app.exception';
import { PersonDirectory } from '../../people/services/person-directory';
import { ProfileService } from '../../profile/services/profile.service';
import { PolicyRepository, type PolicyWithDetail } from '../repositories/policy.repository';
import { toPolicyDocument } from '../utils/policy-document';
import { aboutPolicy } from '../utils/activity-subjects';
import { policyFacts, policyView } from '../utils/policy-view';

/** Who is looking: their login, and whether they are an admin. */
export interface PolicyViewer {
  email: string;
  isAdmin: boolean;
}

/** Who is making a change, to be named in the activity log. */
export interface PolicyActor extends ActivityActor, PolicyViewer {
  id: string;
}

const ACTIONS: Record<string, ActivityAction> = {
  'draft>in_review': 'POLICY_REVIEW_REQUESTED',
  'in_review>approved': 'POLICY_APPROVED',
  'in_review>draft': 'POLICY_SENT_BACK',
  'approved>draft': 'POLICY_REOPENED',
};

@Injectable()
export class PoliciesService {
  constructor(
    private readonly policies: PolicyRepository,
    private readonly activity: ActivityService,
    private readonly profile: ProfileService,
    private readonly directory: PersonDirectory,
  ) {}

  async list(): Promise<PolicyListResponse> {
    const rows = await this.policies.findActive();
    return { policies: rows.map(policyView) };
  }

  async detail(id: string, viewer: PolicyViewer): Promise<PolicyDetailResponse> {
    const row = await this.find(id);
    const content = this.effectiveContent(row);
    return {
      ...policyView(row),
      ...policyFacts(row),
      approvals: row.approvals.map((approval) => ({
        version: approval.version,
        approvedAt: approval.approvedAt.toISOString(),
        approvedByName: approval.approvedByName,
        changelog: approval.changelog,
      })),
      content,
      editedAt:
        (row.contentEditedAt ?? (row.content ? row.updatedAt : null))?.toISOString() ?? null,
      editedByName: row.contentEditedByName,
      changelog: row.changelog,
      canDecide: this.mayDecide(row, viewer),
      values: await this.valuesFor(content),
    };
  }

  async version(id: string, version: number): Promise<PolicyVersionResponse> {
    await this.find(id);
    const approval = await this.policies.findVersion(id, version);
    if (!approval) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    const content = toPolicyDocument(approval.content);
    return { content, values: await this.valuesFor(content) };
  }

  /** Saves the working text. It can only be edited while the policy is a draft. */
  async saveContent(
    id: string,
    content: PolicyDocument,
    actor: PolicyActor,
  ): Promise<PolicyDetailResponse> {
    const policy = await this.find(id);
    if (policy.status !== 'draft') throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    await this.policies.saveContent(id, content, actor.label);
    await this.activity.record({ actor, action: 'POLICY_EDITED', ...aboutPolicy(policy) });
    return this.detail(id, actor);
  }

  async setApprover(
    id: string,
    approverId: string | null,
    actor: PolicyActor,
  ): Promise<PolicyDetailResponse> {
    const policy = await this.find(id);
    const nextName = await this.approverName(approverId);
    if ((policy.approverId ?? null) !== approverId) {
      await this.policies.setApprover(id, approverId);
      await this.activity.record({
        actor,
        action: 'POLICY_APPROVER_CHANGED',
        ...aboutPolicy(policy),
        before: { value: policy.approver?.name ?? '' },
        after: { value: nextName },
      });
    }
    return this.detail(id, actor);
  }

  /** The name of the person to make approver, who must still work here. Empty when going back to the title. */
  private async approverName(approverId: string | null): Promise<string> {
    if (!approverId) return '';
    return (await this.directory.requireActive(approverId)).name;
  }

  async changeStatus(
    id: string,
    to: PolicyStatus,
    actor: PolicyActor,
    changelog?: string,
  ): Promise<PolicyDetailResponse> {
    const policy = await this.find(id);
    const from = policy.status;
    if (!POLICY_TRANSITIONS[from].includes(to)) {
      throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    }
    this.assertMayMove(policy, from, to, actor);

    const approver = { id: actor.id, name: actor.label };
    const moved =
      to === 'approved'
        ? (await this.policies.approve(
            id,
            from,
            approver,
            this.effectiveContent(policy),
            policy.changelog,
          )) !== null
        : await this.policies.setStatus(
            id,
            from,
            to,
            to === 'in_review' ? changelog || null : null,
          );
    // Someone else moved it between our read and our write.
    if (!moved) throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    await this.activity.record({
      actor,
      action: ACTIONS[`${from}>${to}`]!,
      ...aboutPolicy(policy),
    });
    return this.detail(id, actor);
  }

  /** Anyone who can edit may ask for approval. Approving, sending back and reopening are decisions. */
  private assertMayMove(
    policy: PolicyWithDetail,
    from: PolicyStatus,
    to: PolicyStatus,
    actor: PolicyActor,
  ): void {
    if (transitionNeedsAdmin(from, to) && !this.mayDecide(policy, actor)) {
      throw new AppException('FORBIDDEN', HttpStatus.FORBIDDEN);
    }
  }

  /** Deciding is for the named approver, or for an admin when nobody is named. */
  private mayDecide(policy: PolicyWithDetail, who: PolicyViewer): boolean {
    const named = policy.approver;
    return named ? named.email.toLowerCase() === who.email.toLowerCase() : who.isAdmin;
  }

  /** The saved text, or the starting text until someone edits it: counsel's for a built-in policy, else built from the controls. */
  private effectiveContent(policy: PolicyWithDetail): PolicyDocument {
    if (policy.content) return toPolicyDocument(policy.content);
    const written = policy.templateId ? POLICY_TEXTS[policy.templateId] : undefined;
    if (written) return markdownToDocument(written);
    const requirements = policy.controls
      .filter((link) => !link.control.archivedAt)
      .map(({ control }) => ({ title: control.title, description: control.description }));
    return starterDocument(
      policyTemplate({ templateId: policy.templateId, summary: policy.summary }, requirements),
    );
  }

  /** The company's answers for every `{{key}}` in a text. */
  private async valuesFor(content: PolicyDocument): Promise<Record<string, string>> {
    const { entries } = await this.profile.list();
    return Object.fromEntries(
      tokenKeys(content).map((key) => [
        key,
        entries.find((entry) => entry.key === key)?.value ?? '',
      ]),
    );
  }

  private async find(id: string): Promise<PolicyWithDetail> {
    return activeOrNotFound(await this.policies.findOne(id));
  }
}
