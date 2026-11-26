import { createHash, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PROOF_SNAPSHOT_ACTOR } from '@neeti-bharat/shared';
import { ActivityService } from '../../activity/services/activity.service';
import { currentOrganizationId } from '../../core/org/org-context';
import { FileStorage } from '../../core/storage/file-storage';
import { EvidenceRepository } from '../repositories/evidence.repository';
import {
  ProofRequirementRepository,
  type RequirementWithControl,
} from '../repositories/proof-requirement.repository';
import { aboutControl } from '../utils/activity-subjects';
import { evidenceFileKey } from '../utils/evidence-file';

const SYSTEM_ID = 'system';

/** Proof that no person wrote: a note, or a file the kit made, added to the proof it belongs to. */
@Injectable()
export class SystemProofService {
  constructor(
    private readonly requirements: ProofRequirementRepository,
    private readonly evidence: EvidenceRepository,
    private readonly activity: ActivityService,
    private readonly storage: FileStorage,
  ) {}

  /** Whether a file can be kept. When it cannot, a report is kept as a note instead. */
  canKeepFiles(): boolean {
    return this.storage.isEnabled();
  }

  /** When this adder last left proof under this title on the proof with this catalogue id, if ever. */
  async latestAt(templateId: string, title: string): Promise<Date | null> {
    const requirement = await this.requirements.findCurrentByTemplate(templateId);
    if (!requirement) return null;
    return (await this.evidence.latestBy(requirement.id, SYSTEM_ID, title))?.createdAt ?? null;
  }

  /** Adds a note. False when the company has no such proof, or it has been archived. */
  async attachNote(templateId: string, title: string, note: string): Promise<boolean> {
    const requirement = await this.requirements.findCurrentByTemplate(templateId);
    if (!requirement) return false;
    await this.evidence.create({
      ...this.common(requirement, title),
      kind: 'note',
      url: null,
      note,
    });
    await this.record(requirement, title);
    return true;
  }

  /** Adds a PDF. The file is stored first, and removed again if the proof cannot be saved. */
  async attachPdf(
    templateId: string,
    title: string,
    fileName: string,
    pdf: Buffer,
  ): Promise<boolean> {
    const requirement = await this.requirements.findCurrentByTemplate(templateId);
    if (!requirement) return false;
    const sha256 = createHash('sha256').update(pdf).digest('hex');
    const key = evidenceFileKey(
      currentOrganizationId(),
      requirement.controlId,
      randomUUID(),
      fileName,
    );
    await this.storage.put(key, pdf, { contentType: 'application/pdf', sha256 });
    try {
      await this.evidence.create({
        ...this.common(requirement, title),
        kind: 'file',
        url: null,
        note: null,
        file: { key, name: fileName, size: pdf.length, type: 'application/pdf', sha256 },
      });
      await this.record(requirement, title);
    } catch (error) {
      await this.storage.remove(key).catch(() => undefined);
      throw error;
    }
    return true;
  }

  private common(requirement: RequirementWithControl, title: string) {
    return {
      controlId: requirement.controlId,
      proofRequirementId: requirement.id,
      title,
      addedById: SYSTEM_ID,
      addedByName: PROOF_SNAPSHOT_ACTOR,
    };
  }

  private record(requirement: RequirementWithControl, title: string): Promise<void> {
    return this.activity.record({
      actor: { label: PROOF_SNAPSHOT_ACTOR },
      action: 'EVIDENCE_ADDED',
      ...aboutControl(requirement.control, { proof: title }),
    });
  }
}
