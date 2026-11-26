import { Injectable } from '@nestjs/common';
import type {
  ProofByControlResponse,
  ProofOverviewResponse,
  ProofRequirementDetailResponse,
} from '@neeti-bharat/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { activeOrNotFound, archivedOrNotFound } from '../../core/common/active';
import { newCustomId } from '../../core/common/ids';
import type {
  ListProofByControlInput,
  ListProofInput,
  SaveProofRequirementInput,
} from '../dto/proof-requirement.dto';
import { PersonDirectory } from '../../people/services/person-directory';
import { ControlRepository } from '../repositories/control.repository';
import { ProofRequirementRepository } from '../repositories/proof-requirement.repository';
import { aboutControl } from '../utils/activity-subjects';
import { dayToDate } from '../utils/dates';
import { requirementView } from '../utils/evidence-view';
import { proofByControl, proofList } from '../utils/proof-list';
import { FrameworksService } from './frameworks.service';

const details = (input: SaveProofRequirementInput) => ({
  title: input.title,
  description: input.description,
  frequency: input.frequency,
  assigneeId: input.assigneeId,
  dueDate: dayToDate(input.dueDate),
});

/** What each control needs proof of: the company's own list, which it can add to, change and archive. */
@Injectable()
export class ProofService {
  constructor(
    private readonly controls: ControlRepository,
    private readonly requirements: ProofRequirementRepository,
    private readonly activity: ActivityService,
    private readonly frameworks: FrameworksService,
    private readonly directory: PersonDirectory,
  ) {}

  /** One page of the proof list. When it is narrowed to a control, that control's title comes with it. */
  async overview(query: ListProofInput): Promise<ProofOverviewResponse> {
    const [all, control, covered] = await Promise.all([
      this.frameworks.proofItems(),
      query.controlId ? this.controls.findOne(query.controlId) : null,
      query.policyId ? this.controls.idsCoveredBy(query.policyId) : null,
    ]);
    const items = covered ? all.filter((item) => covered.has(item.controlId)) : all;
    const focus = control
      ? { id: control.id, title: control.title, ruleId: control.requirementId }
      : null;
    return proofList(items, query, focus);
  }

  /** One page of controls, each with the proof it needs. */
  async byControl(query: ListProofByControlInput): Promise<ProofByControlResponse> {
    return proofByControl(await this.frameworks.proofItems(), query);
  }

  /** One requirement with its proof, and the control it is for. */
  async detail(requirementId: string): Promise<ProofRequirementDetailResponse> {
    const row = activeOrNotFound(await this.requirements.findWithEvidence(requirementId));
    const control = await this.frameworks.control(row.controlId);
    return {
      requirement: requirementView(row, new Date()),
      control: {
        id: control.id,
        title: control.title,
        description: control.description,
        status: control.status,
        frameworkId: control.frameworkId,
        requirementId: control.requirementId,
        policies: control.policies,
      },
    };
  }

  async create(
    controlId: string,
    input: SaveProofRequirementInput,
    actor: ActivityActor,
  ): Promise<void> {
    const control = await this.activeControl(controlId);
    await this.assertPerson(input.assigneeId);
    await this.requirements.create({
      id: newCustomId(),
      controlId,
      ...details(input),
    });
    await this.activity.record({
      actor,
      action: 'PROOF_REQUIREMENT_ADDED',
      ...aboutControl(control, { proof: input.title }),
    });
  }

  async save(
    requirementId: string,
    input: SaveProofRequirementInput,
    actor: ActivityActor,
  ): Promise<void> {
    const requirement = await this.activeRequirement(requirementId);
    const control = await this.activeControl(requirement.controlId);
    await this.assertPerson(input.assigneeId);
    await this.requirements.update(requirementId, details(input));
    await this.activity.record({
      actor,
      action: 'PROOF_REQUIREMENT_EDITED',
      ...aboutControl(control, { proof: input.title }),
    });
  }

  async archive(requirementId: string, actor: ActivityActor): Promise<void> {
    const requirement = await this.activeRequirement(requirementId);
    const control = await this.activeControl(requirement.controlId);
    await this.requirements.archive(requirementId);
    await this.activity.record({
      actor,
      action: 'PROOF_REQUIREMENT_ARCHIVED',
      ...aboutControl(control, { proof: requirement.title }),
    });
  }

  async restore(requirementId: string, actor: ActivityActor): Promise<void> {
    const requirement = archivedOrNotFound(await this.requirements.findOne(requirementId));
    const control = await this.activeControl(requirement.controlId);
    await this.requirements.restore(requirementId);
    await this.activity.record({
      actor,
      action: 'PROOF_REQUIREMENT_RESTORED',
      ...aboutControl(control, { proof: requirement.title }),
    });
  }

  /** The person must still work here. */
  private async assertPerson(id: string | null): Promise<void> {
    if (id) await this.directory.requireActive(id);
  }

  private async activeRequirement(id: string) {
    return activeOrNotFound(await this.requirements.findOne(id));
  }

  private async activeControl(id: string) {
    return activeOrNotFound(await this.controls.findOne(id));
  }
}
