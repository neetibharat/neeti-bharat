import { HttpStatus, Injectable } from '@nestjs/common';
import { isLocked } from '@neeti-bharat/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { activeOrNotFound } from '../../core/common/active';
import { AppException } from '../../core/common/app.exception';
import { newCustomId } from '../../core/common/ids';
import type { Framework, Requirement } from '../../generated/prisma/client';
import type { SaveFrameworkInput, SaveRequirementInput } from '../dto/framework.dto';
import { aboutFramework, aboutRequirement } from '../utils/activity-subjects';
import { ControlRepository } from '../repositories/control.repository';
import { FrameworkRepository } from '../repositories/framework.repository';
import { RequirementRepository } from '../repositories/requirement.repository';

/** A company's frameworks and the rules in them. Built-in ones are open to change unless `BUILT_IN_LOCKED` is set. */
@Injectable()
export class FrameworkEditService {
  constructor(
    private readonly frameworks: FrameworkRepository,
    private readonly requirements: RequirementRepository,
    private readonly controls: ControlRepository,
    private readonly activity: ActivityService,
  ) {}

  async create(input: SaveFrameworkInput, actor: ActivityActor): Promise<{ id: string }> {
    const id = newCustomId();
    await this.frameworks.create({ id, ...input });
    await this.activity.record({
      actor,
      action: 'FRAMEWORK_CREATED',
      ...aboutFramework(id, input.name),
    });
    return { id };
  }

  async update(id: string, input: SaveFrameworkInput, actor: ActivityActor): Promise<void> {
    await this.ownFramework(id);
    await this.frameworks.update(id, input);
    await this.activity.record({
      actor,
      action: 'FRAMEWORK_EDITED',
      ...aboutFramework(id, input.name),
    });
  }

  async archive(id: string, actor: ActivityActor): Promise<void> {
    const framework = await this.ownFramework(id);
    if ((await this.controls.countActiveInFramework(id)) > 0) {
      throw new AppException('HAS_CONTROLS', HttpStatus.CONFLICT);
    }
    await this.frameworks.setArchived(id, new Date());
    await this.activity.record({
      actor,
      action: 'FRAMEWORK_ARCHIVED',
      ...aboutFramework(id, framework.name),
    });
  }

  async createRequirement(
    frameworkId: string,
    input: SaveRequirementInput,
    actor: ActivityActor,
  ): Promise<{ id: string }> {
    const framework = await this.ownFramework(frameworkId);
    const id = newCustomId();
    await this.requirements.create({ id, frameworkId, ...input });
    await this.activity.record({
      actor,
      action: 'REQUIREMENT_CREATED',
      ...aboutRequirement(id, input, framework.name),
    });
    return { id };
  }

  async updateRequirement(
    id: string,
    input: SaveRequirementInput,
    actor: ActivityActor,
  ): Promise<void> {
    const { framework } = await this.ownRequirement(id);
    await this.requirements.update(id, input);
    await this.activity.record({
      actor,
      action: 'REQUIREMENT_EDITED',
      ...aboutRequirement(id, input, framework.name),
    });
  }

  async archiveRequirement(id: string, actor: ActivityActor): Promise<void> {
    const { requirement, framework } = await this.ownRequirement(id);
    if ((await this.controls.countActiveInRequirement(id)) > 0) {
      throw new AppException('HAS_CONTROLS', HttpStatus.CONFLICT);
    }
    await this.requirements.setArchived(id, new Date());
    await this.activity.record({
      actor,
      action: 'REQUIREMENT_ARCHIVED',
      ...aboutRequirement(id, requirement, framework.name),
    });
  }

  /** A framework that can change. One that is missing or archived is not found, and a locked built-in one is refused. */
  private async ownFramework(id: string): Promise<Framework> {
    const framework = activeOrNotFound(await this.frameworks.findOne(id));
    if (isLocked(framework.isBuiltIn)) throw new AppException('BUILT_IN', HttpStatus.CONFLICT);
    return framework;
  }

  private async ownRequirement(
    id: string,
  ): Promise<{ requirement: Requirement; framework: Framework }> {
    const requirement = activeOrNotFound(await this.requirements.findOne(id));
    return { requirement, framework: await this.ownFramework(requirement.frameworkId) };
  }
}
