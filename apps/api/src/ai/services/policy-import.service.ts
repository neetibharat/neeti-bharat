import { HttpStatus, Injectable } from '@nestjs/common';
import type { PolicyImportResponse } from '@dpdp-kit/shared';
import { AppException } from '../../core/common/app.exception';
import type { UploadedFile } from '../../frameworks/utils/evidence-file';
import { AiClient, AiProviderError, type AiTarget } from '../providers/ai-client';
import { readDocumentText } from '../utils/document-text';
import { UnusableReply, importPrompt, toImportResponse } from '../utils/import-prompt';
import { AiSettingsService } from './ai-settings.service';

/**
 * Reads a policy out of a file with the company's AI service, for the Add policy form to fill in. The file and what
 * the AI says about it are held only while this runs: nothing is saved until a person adds the policy.
 */
@Injectable()
export class PolicyImportService {
  constructor(
    private readonly settings: AiSettingsService,
    private readonly client: AiClient,
  ) {}

  async read(file: UploadedFile | undefined): Promise<PolicyImportResponse> {
    if (!file) throw new AppException('FILE_REQUIRED', HttpStatus.BAD_REQUEST);
    const target = await this.settings.target();
    const text = await readDocumentText(file);
    return this.parse(await this.ask(target, file.originalname, text));
  }

  private async ask(target: AiTarget, fileName: string, text: string): Promise<string> {
    try {
      return await this.client.completeJson(target, importPrompt(fileName, text));
    } catch (error) {
      if (!(error instanceof AiProviderError)) throw error;
      throw new AppException('AI_FAILED', HttpStatus.BAD_GATEWAY, {
        reason: error.reason,
        detail: error.detail,
      });
    }
  }

  /** An answer that is not the JSON asked for is the service's failure, not the person's. */
  private parse(reply: string): PolicyImportResponse {
    try {
      return toImportResponse(reply);
    } catch (error) {
      if (!(error instanceof UnusableReply)) throw error;
      throw new AppException('AI_FAILED', HttpStatus.BAD_GATEWAY, {
        reason: 'unusable',
      });
    }
  }
}
