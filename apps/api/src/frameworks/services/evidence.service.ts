import { randomUUID } from 'node:crypto';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  EVIDENCE_DOWNLOAD_SECONDS,
  type EvidenceDownloadResponse,
  type EvidenceListResponse,
  type EvidenceResponse,
  type ProofFrequency,
} from '@dpdp-kit/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { activeOrNotFound } from '../../core/common/active';
import { AppException } from '../../core/common/app.exception';
import { currentOrganizationId } from '../../core/org/org-context';
import { FileStorage } from '../../core/storage/file-storage';
import type { AddEvidenceFileInput, AddEvidenceInput } from '../dto/evidence.dto';
import { ControlRepository, type ControlWithLinks } from '../repositories/control.repository';
import { EvidenceRepository } from '../repositories/evidence.repository';
import { ProofRequirementRepository } from '../repositories/proof-requirement.repository';
import { aboutControl } from '../utils/activity-subjects';
import {
  checkEvidenceFile,
  evidenceFileKey,
  type CheckedFile,
  type UploadedFile,
} from '../utils/evidence-file';
import { evidenceView as view } from '../utils/evidence-view';

/** A title that is only the file's own name stays out of the log, which never holds file names. */
const loggedTitle = (row: { title: string; fileName: string | null }): string =>
  row.fileName !== null && row.title === row.fileName ? 'file' : row.title;

/** Proof that a control is in place. A control is done when all the proof it needs is in. */
@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);

  constructor(
    private readonly controls: ControlRepository,
    private readonly evidence: EvidenceRepository,
    private readonly requirements: ProofRequirementRepository,
    private readonly activity: ActivityService,
    private readonly storage: FileStorage,
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

  /**
   * Attaches a file as proof. The object is stored first; if saving the row or the log entry then fails,
   * the object is removed again so storage holds nothing the database does not know about.
   */
  async addFile(
    controlId: string,
    input: AddEvidenceFileInput,
    file: UploadedFile | undefined,
    actor: ActivityActor & { id: string },
  ): Promise<EvidenceResponse> {
    const control = await this.active(controlId);
    await this.assertRequirement(controlId, input.proofRequirementId);
    if (!this.storage.isEnabled()) {
      throw new AppException('STORAGE_NOT_CONFIGURED', HttpStatus.SERVICE_UNAVAILABLE);
    }
    if (!file) throw new AppException('FILE_REQUIRED', HttpStatus.BAD_REQUEST);
    const checked = checkEvidenceFile(file);
    const key = evidenceFileKey(currentOrganizationId(), controlId, randomUUID(), checked.fileName);
    await this.storage.put(key, file.buffer, {
      contentType: checked.contentType,
      sha256: checked.sha256,
    });
    try {
      return await this.saveFile(
        control,
        input,
        { key, size: file.buffer.length, ...checked },
        actor,
      );
    } catch (error) {
      await this.discard(key);
      throw error;
    }
  }

  /** A short-lived link to a file of this control. Anything that is not a file of this control is not found. */
  async download(controlId: string, evidenceId: string): Promise<EvidenceDownloadResponse> {
    await this.find(controlId);
    const row = await this.evidence.findOne(evidenceId, controlId);
    if (!row || row.kind !== 'file' || !row.fileKey) {
      throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    const url = await this.storage.signedDownloadUrl(row.fileKey, {
      fileName: row.fileName!,
      contentType: row.fileType!,
      expiresInSeconds: EVIDENCE_DOWNLOAD_SECONDS,
    });
    const expiresAt = new Date(Date.now() + EVIDENCE_DOWNLOAD_SECONDS * 1000).toISOString();
    return { url, expiresAt };
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
      ...aboutControl(control, { proof: loggedTitle(row) }),
    });
    if (row.fileKey) await this.discard(row.fileKey);
  }

  /** The row and its log entry. The log says what was added, never the file's name, contents or hash. */
  private async saveFile(
    control: ControlWithLinks,
    input: AddEvidenceFileInput,
    file: CheckedFile & { key: string; size: number },
    actor: ActivityActor & { id: string },
  ): Promise<EvidenceResponse> {
    const title = input.title ?? file.fileName;
    const row = await this.evidence.create({
      controlId: control.id,
      proofRequirementId: input.proofRequirementId ?? null,
      kind: 'file',
      title,
      url: null,
      note: null,
      file: {
        key: file.key,
        name: file.fileName,
        size: file.size,
        type: file.contentType,
        sha256: file.sha256,
      },
      addedById: actor.id,
      addedByName: actor.label,
    });
    await this.activity.record({
      actor,
      action: 'EVIDENCE_ADDED',
      ...aboutControl(control, { proof: input.title ?? 'file' }),
    });
    return view(row);
  }

  /** Deletes a stored object. A failure is logged, not raised: the proof is already gone, and a stray object harms nothing. */
  private async discard(key: string): Promise<void> {
    try {
      await this.storage.remove(key);
    } catch (error) {
      this.logger.error(`Could not remove stored file ${key}`, error);
    }
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
