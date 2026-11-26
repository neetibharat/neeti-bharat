import { Body, Controller, Get, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  POLICY_IMPORT_MAX_BYTES,
  type AiSettingsResponse,
  type PolicyImportResponse,
} from '@neeti-bharat/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { NoApiKey, Roles } from '../../core/org/roles.decorator';
import { TransactionAfterBody } from '../../core/prisma/transaction.interceptor';
import type { UploadedFile as Upload } from '../../frameworks/utils/evidence-file';
import {
  ImportPolicyDto,
  SaveAiFeaturesDto,
  saveAiFeaturesSchema,
  type SaveAiFeaturesInput,
} from '../dto/ai.dto';
import { AiSettingsService } from '../services/ai-settings.service';
import { PolicyImportService } from '../services/policy-import.service';

// Memory storage: the file is read and thrown away in one step, and nothing is left on disk.
const UPLOAD = {
  limits: { fileSize: POLICY_IMPORT_MAX_BYTES, files: 1, fields: 0 },
  // Browsers send file names as UTF-8; multer would otherwise read them as Latin-1.
  defParamCharset: 'utf8',
};

@ApiTags('AI')
@ApiCookieAuth()
@Controller()
export class AiController {
  constructor(
    private readonly settings: AiSettingsService,
    private readonly imports: PolicyImportService,
  ) {}

  @Get('ai')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({
    summary:
      'Which AI service the install uses and which features are on. The key is never sent, only its last four characters',
  })
  get(): Promise<AiSettingsResponse> {
    return this.settings.get();
  }

  @Put('ai/features')
  @Roles(['admin'])
  @NoApiKey()
  @ApiOperation({
    summary:
      'Choose which AI features are on. The service, model and key come from the environment (admin only, never an API key)',
  })
  @ApiBody({ type: SaveAiFeaturesDto })
  setFeatures(
    @Body(new ZodValidationPipe(saveAiFeaturesSchema)) body: SaveAiFeaturesInput,
    @Session() { user }: UserSession,
  ): Promise<AiSettingsResponse> {
    return this.settings.setFeatures(body.enabledFeatures, actorOf(user));
  }

  // Nothing is saved here, so there is no transaction to hold open while the AI reads. Spending the company's AI
  // key is for people, not for an API key.
  @Post('policies/import')
  @Roles(['admin', 'member'])
  @NoApiKey()
  @TransactionAfterBody()
  @UseInterceptors(FileInterceptor('file', UPLOAD))
  @ApiOperation({
    summary:
      'Read a policy from a PDF, Word or PowerPoint file and suggest its title, summary, owner, approver and text. Nothing is saved (admin and member)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: ImportPolicyDto })
  import(
    @UploadedFile() file: Upload | undefined,
    @Session() { user }: UserSession,
  ): Promise<PolicyImportResponse> {
    return this.imports.read(file, actorOf(user));
  }
}
