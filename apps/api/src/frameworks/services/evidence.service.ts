import { HttpStatus, Injectable } from '@nestjs/common';
import {
  type EvidenceListResponse,
  type EvidenceResponse,
  type ProofFrequency,
} from '@dpdp-kit/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { activeOrNotFound } from '../../core/common/active';
import { AppException } from '../../core/common/app.exception';
import type { AddEvidenceInput } from '../dto/evidence.dto';
import { ControlRepository, type ControlWithLinks } from '../repositories/control.repository';
import { EvidenceRepository } from '../repositories/evidence.repository';
import { ProofRequirementRepository } from '../repositories/proof-requirement.repository';
import { aboutControl } from '../utils/activity-subjects';
import { evidenceView as view } from '../utils/evidence-view';

/** Proof that a control is in place. A control is done when all the proof it needs is in. */
@Injectable()
export class EvidenceService {
  constructor(
    private readonly controls: ControlRepository,
    private readonly evidence: EvidenceRepository,
    private readonly requirements: ProofRequirementRepository,
    private readonly activity: ActivityService,
  ) {}

  /** The control's archived requirements, and proof attached to it that is not for any one requirement. */
  async list(controlId: string): Promise<EvidenceListResponse> {
    await this.find(controlId);
    const [archived, general] = await Promise.all([
      this.requirements.findArchivedByControl(controlId),
      this.evidence.findGeneral(controlId),
    ]);
    return {
      archived: archived.map(({ id, title, frequency }) => ({
        id,
        title,
        frequency: frequency as ProofFrequency,
      })),
      other: general.map(view),
    };
  }

  async add(
    controlId: string,
    input: AddEvidenceInput,
    actor: ActivityActor & { id: string },
  ): Promise<EvidenceResponse> {
    const control = await this.active(controlId);
    await this.assertRequirement(controlId, input.proofRequirementId);
    const row = await this.evidence.create({
      controlId,
      proofRequirementId: input.proofRequirementId ?? null,
      kind: input.kind,
      title: input.title,
      url: input.kind === 'link' ? input.url : null,
      note: input.kind === 'note' ? input.note : null,
      addedById: actor.id,
      addedByName: actor.label,
    });
    await this.activity.record({
      actor,
      action: 'EVIDENCE_ADDED',
      ...aboutControl(control, { proof: input.title }),
    });
    return view(row);
  }

  /** Removes a piece of proof. A control that no longer has all it needs stops being done on its own. */
  async remove(controlId: string, evidenceId: string, actor: ActivityActor): Promise<void> {
    const control = await this.active(controlId);
    const row = await this.evidence.findOne(evidenceId, controlId);
    if (!row) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    await this.evidence.delete(evidenceId);
    await this.activity.record({
      actor,
      action: 'EVIDENCE_REMOVED',
      ...aboutControl(control, { proof: row.title }),
    });
  }

  /** Proof for a requirement must go to one of this control's own requirements that is still in use. */
  private async assertRequirement(controlId: string, requirementId?: string): Promise<void> {
    if (!requirementId) return;
    const requirement = await this.requirements.findOne(requirementId);
    if (!requirement || requirement.controlId !== controlId || requirement.archivedAt) {
      throw new AppException('VALIDATION_FAILED', HttpStatus.BAD_REQUEST);
    }
  }

  private async find(controlId: string): Promise<ControlWithLinks> {
    const control = await this.controls.findOne(controlId);
    if (!control) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    return control;
  }

  private async active(controlId: string): Promise<ControlWithLinks> {
    return activeOrNotFound(await this.controls.findOne(controlId));
  }
}
