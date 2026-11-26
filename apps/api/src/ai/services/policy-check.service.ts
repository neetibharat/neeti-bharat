import { HttpStatus, Injectable } from '@nestjs/common';
import { documentToMarkdown, type PolicyCheckResponse } from '@neeti-bharat/shared';
import { AppException } from '../../core/common/app.exception';
import { PoliciesService } from '../../frameworks/services/policies.service';
import { PolicyScopeReader } from '../../frameworks/services/policy-scope-reader';
import { checkTask } from '../tasks/policy-check.task';
import { AiRunner } from './ai-runner.service';
import type { AiAsker } from './policy-tailor.service';

/** Reads a policy against the rules and controls it covers. Nothing is saved: it is a second opinion, not a verdict. */
@Injectable()
export class PolicyCheckService {
  constructor(
    private readonly runner: AiRunner,
    private readonly policies: PoliciesService,
    private readonly scope: PolicyScopeReader,
  ) {}

  async check(id: string, asker: AiAsker): Promise<PolicyCheckResponse> {
    const policy = await this.policies.detail(id, asker.viewer);
    const rules = await this.scope.rulesCoveredBy(id);
    if (rules.length === 0) {
      throw new AppException('NOTHING_TO_CHECK', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return this.runner.run(
      checkTask({ title: policy.title, markdown: documentToMarkdown(policy.content), rules }),
      { actor: asker.actor, subject: { type: 'policy', id } },
    );
  }
}
