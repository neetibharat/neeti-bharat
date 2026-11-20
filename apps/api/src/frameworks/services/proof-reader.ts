import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../core/common/app.exception';
import { FileStorage } from '../../core/storage/file-storage';
import { ControlRepository } from '../repositories/control.repository';
import { EvidenceRepository } from '../repositories/evidence.repository';
import { ProofRequirementRepository } from '../repositories/proof-requirement.repository';

/** One piece of proof with what it was added for, and the file's bytes when it is a file. */
export interface ProofToRead {
  kind: string;
  title: string;
  note: string | null;
  url: string | null;
  fileName: string | null;
  bytes: Buffer | null;
  control: { title: string; description: string };
  requirement: { title: string; description: string; frequency: string } | null;
}

/** Read-only view of one piece of proof, for modules that look at what it shows. */
@Injectable()
export class ProofReader {
  constructor(
    private readonly controls: ControlRepository,
    private readonly evidence: EvidenceRepository,
    private readonly requirements: ProofRequirementRepository,
    private readonly storage: FileStorage,
  ) {}

  /** Anything that is not proof on this control is not found. */
  async read(controlId: string, evidenceId: string): Promise<ProofToRead> {
    const control = await this.controls.findOne(controlId);
    const row =
      control && !control.archivedAt ? await this.evidence.findOne(evidenceId, controlId) : null;
    if (!control || !row) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    const requirement = row.proofRequirementId
      ? await this.requirements.findOne(row.proofRequirementId)
      : null;
    return {
      kind: row.kind,
      title: row.title,
      note: row.note,
      url: row.url,
      fileName: row.fileName,
      bytes: row.fileKey ? await this.storage.read(row.fileKey) : null,
      control: { title: control.title, description: control.description },
      requirement: requirement && {
        title: requirement.title,
        description: requirement.description,
        frequency: requirement.frequency,
      },
    };
  }
}
