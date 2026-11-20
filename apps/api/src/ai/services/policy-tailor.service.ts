import { HttpStatus, Injectable } from '@nestjs/common';
import { documentToMarkdown, type PolicyTailorResponse } from '@dpdp-kit/shared';
import type { ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import { PoliciesService } from '../../frameworks/services/policies.service';
import { ProfileService } from '../../profile/services/profile.service';
import { VendorBriefReader } from '../../vendors/services/vendor-brief-reader';
import { tailorTask } from '../tasks/policy-tailor.task';
import { AiRunner } from './ai-runner.service';

/** Who is asking, for the AI's use to be logged and for a policy to be read as they see it. */
export interface AiAsker {
  actor: ActivityActor;
  viewer: { email: string; isAdmin: boolean };
}

/**
 * Rewrites a draft policy for the company, from the company profile, the vendors it uses and what the person tells it. Nothing is saved: the person reads the
 * proposal and replaces the text themselves.
 */
@Injectable()
export class PolicyTailorService {
  constructor(
    private readonly runner: AiRunner,
    private readonly policies: PoliciesService,
    private readonly profile: ProfileService,
    private readonly vendors: VendorBriefReader,
  ) {}

  async tailor(id: string, asker: AiAsker, context = ''): Promise<PolicyTailorResponse> {
    const policy = await this.policies.detail(id, asker.viewer);
    if (policy.status !== 'draft') throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    const { entries } = await this.profile.list();
    const answers = entries.map((entry) => ({ key: entry.key, value: entry.value }));
    const vendors = await this.vendors.active();
    return this.runner.run(
      tailorTask({
        title: policy.title,
        summary: policy.summary,
        markdown: documentToMarkdown(policy.content),
        document: policy.content,
        answers,
        vendors,
        context,
      }),
      { actor: asker.actor, subject: { type: 'policy', id } },
    );
  }
}
