import { HttpStatus, Injectable } from '@nestjs/common';
import { type AssigneesResponse, type ControlResponse } from '@neeti-bharat/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { archivedOrNotFound, activeOrNotFound } from '../../core/common/active';
import { AppException } from '../../core/common/app.exception';
import { newCustomId } from '../../core/common/ids';
import { PersonDirectory } from '../../people/services/person-directory';
import type { ControlDetailsInput, CreateControlInput, SaveControlInput } from '../dto/control.dto';
import { ControlRepository, type ControlWithLinks } from '../repositories/control.repository';
import { PolicyRepository } from '../repositories/policy.repository';
import { planOwnerChange, storedOwner } from '../utils/control-change';
import { aboutControl } from '../utils/activity-subjects';
import { dayToDate } from '../utils/dates';
import { diffDetails } from '../utils/control-details';
import { defaultOwnerFor, type ControlRow, type PolicyBriefs } from '../utils/checklist-view';
import { FrameworksService } from './frameworks.service';

/** The company's own changes to its controls: edit, add, archive and bring back. */
@Injectable()
export class ControlEditService {
  constructor(
    private readonly controls: ControlRepository,
    private readonly policies: PolicyRepository,
    private readonly directory: PersonDirectory,
    private readonly activity: ActivityService,
    private readonly frameworks: FrameworksService,
  ) {}

  async assignees(): Promise<AssigneesResponse> {
    return { people: await this.directory.activePeople() };
  }

  async create(input: CreateControlInput, actor: ActivityActor): Promise<ControlResponse> {
    const { frameworkId } = await this.frameworks.assertRule(input.requirementId);
    await this.assertAllowed(input);
    const id = newCustomId();
    await this.controls.create(
      {
        id,
        frameworkId,
        requirementId: input.requirementId,
        title: input.title,
        description: input.description,
        assigneeId: input.assigneeId,
        reviewDate: dayToDate(input.reviewDate),
      },
      input.policyIds,
    );
    await this.activity.record({
      actor,
      action: 'CONTROL_CREATED',
      ...aboutControl({ id, title: input.title }),
    });
    return this.frameworks.control(id);
  }

  async save(id: string, input: SaveControlInput, actor: ActivityActor): Promise<ControlResponse> {
    const control = await this.active(id);
    const policies = await this.assertAllowed(input);
    const change = diffDetails(control, input);
    const owner = this.ownerChange(control, input, new Map(policies.map((p) => [p.id, p])));

    if (change.edited || change.assignee || owner) {
      await this.controls.saveDetails(
        id,
        {
          title: input.title,
          description: input.description,
          assigneeId: input.assigneeId,
          reviewDate: dayToDate(input.reviewDate),
          ...(owner ? { ownerRole: owner.stored } : {}),
        },
        input.policyIds,
      );
    }
    if (change.edited)
      await this.activity.record({
        actor,
        action: 'CONTROL_EDITED',
        ...aboutControl({ id, title: input.title }),
      });
    if (change.assignee) await this.recordAssignee(actor, id, input.title, change.assignee);
    if (owner) await this.recordOwner(actor, id, input.title, owner.change);
    return this.frameworks.control(id);
  }

  async archive(id: string, actor: ActivityActor): Promise<void> {
    const control = await this.active(id);
    await this.controls.setArchived(id, new Date());
    await this.activity.record({ actor, action: 'CONTROL_ARCHIVED', ...aboutControl(control) });
  }

  async restore(id: string, actor: ActivityActor): Promise<void> {
    const control = archivedOrNotFound(await this.controls.findOne(id));
    await this.controls.setArchived(id, null);
    await this.activity.record({ actor, action: 'CONTROL_RESTORED', ...aboutControl(control) });
  }

  private async active(id: string): Promise<ControlWithLinks> {
    return activeOrNotFound(await this.controls.findOne(id));
  }

  /** Who is accountable after this save, and what to store. Picking the default owner stores nothing. */
  private ownerChange(control: ControlWithLinks, input: SaveControlInput, briefs: PolicyBriefs) {
    const asRow = (policyIds: string[]) =>
      ({ ...control, policies: policyIds.map((policyId) => ({ policyId })) }) as ControlRow;
    const current =
      control.ownerRole ?? defaultOwnerFor(asRow(control.policies.map((l) => l.policyId)), briefs);
    const defaultOwner = defaultOwnerFor(asRow(input.policyIds), briefs);
    const change = planOwnerChange(current, defaultOwner, { ownerRole: input.ownerRole });
    return change ? { change, stored: storedOwner(defaultOwner, change) } : null;
  }

  private recordOwner(
    actor: ActivityActor,
    id: string,
    title: string,
    change: { from: string; to: string },
  ): Promise<void> {
    return this.activity.record({
      actor,
      action: 'CONTROL_OWNER_CHANGED',
      ...aboutControl({ id, title }),
      before: { value: change.from },
      after: { value: change.to },
    });
  }

  /** The policies must exist and the person must still work here. Returns the active policies it checked against. */
  private async assertAllowed(input: ControlDetailsInput) {
    const [policies, people] = await Promise.all([
      this.policies.findActive(),
      this.directory.activePeople(),
    ]);
    const policyIds = new Set(policies.map((policy) => policy.id));
    const unknownPolicy = input.policyIds.some((id) => !policyIds.has(id));
    const duplicate = new Set(input.policyIds).size !== input.policyIds.length;
    const unknownPerson = input.assigneeId && !people.some((p) => p.id === input.assigneeId);
    if (unknownPolicy || duplicate || unknownPerson) {
      throw new AppException('VALIDATION_FAILED', HttpStatus.BAD_REQUEST);
    }
    return policies;
  }

  private async recordAssignee(
    actor: ActivityActor,
    id: string,
    title: string,
    change: { from: string | null; toId: string | null },
  ): Promise<void> {
    const to = (await this.directory.activePeople()).find((p) => p.id === change.toId)?.name ?? '';
    await this.activity.record({
      actor,
      action: 'CONTROL_ASSIGNED',
      ...aboutControl({ id, title }),
      before: { value: change.from ?? '' },
      after: { value: to },
    });
  }
}
