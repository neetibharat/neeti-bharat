import { HttpStatus, Injectable } from '@nestjs/common';
import type { PolicyImportResponse } from '@neeti-bharat/shared';
import type { ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import type { UploadedFile } from '../../frameworks/utils/evidence-file';
import { ProfileService } from '../../profile/services/profile.service';
import { readDocumentText } from '../utils/document-text';
import { importPrompt, toImportResponse } from '../utils/import-prompt';
import { AiRunner } from './ai-runner.service';

/**
 * Reads a policy out of a file with the company's AI service, for the Add policy form to fill in. The file and what
 * the AI says about it are held only while this runs: nothing is saved until a person adds the policy.
 */
@Injectable()
export class PolicyImportService {
  constructor(
    private readonly runner: AiRunner,
    private readonly profile: ProfileService,
  ) {}

  async read(file: UploadedFile | undefined, actor: ActivityActor): Promise<PolicyImportResponse> {
    if (!file) throw new AppException('FILE_REQUIRED', HttpStatus.BAD_REQUEST);
    const text = await readDocumentText(file);
    const { entries } = await this.profile.list();
    return this.runner.run(
      {
        feature: 'policy_import',
        prompt: importPrompt(file.originalname, text, entries),
        parse: toImportResponse,
      },
      { actor, subject: { type: 'policy' } },
    );
  }
}
