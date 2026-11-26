import { HttpStatus, Injectable } from '@nestjs/common';
import type { ProofCheckResponse } from '@neeti-bharat/shared';
import type { ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import { ProofReader, type ProofToRead } from '../../frameworks/services/proof-reader';
import { proofCheckTask } from '../tasks/proof-check.task';
import { readDocumentText } from '../utils/document-text';
import { AiRunner } from './ai-runner.service';

/** The text of a file, or null when it has none to give: a picture, a scan, a type that cannot be read, or far too long. */
async function textOf(proof: ProofToRead): Promise<string | null> {
  if (!proof.bytes) return null;
  try {
    return await readDocumentText({
      originalname: proof.fileName ?? proof.title,
      buffer: proof.bytes,
      size: proof.bytes.length,
    });
  } catch (error) {
    if (error instanceof AppException) return null;
    throw error;
  }
}

/** Reads one piece of proof against what it was added for. Only its text goes to the AI; nothing is saved. */
@Injectable()
export class ProofCheckService {
  constructor(
    private readonly runner: AiRunner,
    private readonly proofs: ProofReader,
  ) {}

  async check(
    controlId: string,
    evidenceId: string,
    actor: ActivityActor,
  ): Promise<ProofCheckResponse> {
    const proof = await this.proofs.read(controlId, evidenceId);
    const fileText = await textOf(proof);
    // A link or a picture on its own has no text to judge by, so there is nothing to ask.
    if (!fileText && !proof.note) {
      throw new AppException('NOTHING_TO_CHECK', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return this.runner.run(
      proofCheckTask({
        control: proof.control,
        requirement: proof.requirement,
        proof: {
          kind: proof.kind,
          title: proof.title,
          note: proof.note,
          url: proof.url,
          fileName: proof.fileName,
        },
        fileText,
      }),
      { actor, subject: { type: 'control', id: controlId } },
    );
  }
}
