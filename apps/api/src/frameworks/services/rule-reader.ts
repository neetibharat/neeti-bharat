import { HttpStatus, Injectable } from '@nestjs/common';
import type { SetupAnswers } from '@neeti-bharat/shared';
import { activeOrNotFound } from '../../core/common/active';
import { AppException } from '../../core/common/app.exception';
import { ProfileService } from '../../profile/services/profile.service';
import type { Framework } from '../../generated/prisma/client';
import { FrameworkRepository } from '../repositories/framework.repository';
import { RequirementRepository } from '../repositories/requirement.repository';
import type { RequirementRow } from '../utils/checklist-view';
import { setupAnswersOf } from '../utils/setup-answers';

/** The rules of a framework, and the company answers that switch some of them on or off. */
@Injectable()
export class RuleReader {
  constructor(
    private readonly requirements: RequirementRepository,
    private readonly profile: ProfileService,
    private readonly frameworks: FrameworkRepository,
  ) {}

  /** One framework. A framework that does not exist, or was archived, is not found. */
  async framework(id: string): Promise<Framework> {
    return activeOrNotFound(await this.frameworks.findOne(id));
  }

  /** Every framework the company follows, in order. */
  frameworkList(): Promise<Framework[]> {
    return this.frameworks.findActive();
  }

  /** The rules in order, with the set-up answers that decide which of them apply. */
  async forChecklist(
    frameworkId: string,
  ): Promise<{ requirements: RequirementRow[]; answers: SetupAnswers }> {
    const [requirements, { entries }] = await Promise.all([
      this.requirements.findActive(frameworkId),
      this.profile.list(),
    ]);
    return { requirements, answers: setupAnswersOf(entries) };
  }

  /** A control can only be added under a rule that exists and has not been archived. */
  async assertActive(id: string): Promise<{ frameworkId: string }> {
    const rule = await this.requirements.findOne(id);
    if (!rule || rule.archivedAt) {
      throw new AppException('VALIDATION_FAILED', HttpStatus.BAD_REQUEST);
    }
    return { frameworkId: rule.frameworkId };
  }

  /** Every framework and every rule, with the set-up answers, read once. */
  async everything(): Promise<{
    frameworks: Framework[];
    requirements: RequirementRow[];
    answers: SetupAnswers;
  }> {
    const [frameworks, requirements, { entries }] = await Promise.all([
      this.frameworks.findActive(),
      this.requirements.findAllActive(),
      this.profile.list(),
    ]);
    return { frameworks, requirements, answers: setupAnswersOf(entries) };
  }
}
