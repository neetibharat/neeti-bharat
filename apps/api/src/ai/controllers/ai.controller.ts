import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  POLICY_IMPORT_MAX_BYTES,
  type AiSettingsResponse,
  type PolicyImportResponse,
} from '@dpdp-kit/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { NoApiKey, Roles } from '../../core/org/roles.decorator';
import { TransactionAfterBody } from '../../core/prisma/transaction.interceptor';
import type { UploadedFile as Upload } from '../../frameworks/utils/evidence-file';
import {
  ImportPolicyDto,
  SaveAiSettingsDto,
  saveAiSettingsSchema,
  type SaveAiSettingsInput,
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
      'Which AI service is set up for the company. The key is never sent, only its last four characters',
  })
  get(): Promise<AiSettingsResponse> {
    return this.settings.get();
  }

  // The key is handled by a person only: an API key cannot set or remove it. Trying the key with the service
  // takes a moment, so the route keeps out of the request-wide transaction and saves in one of its own.
  @Put('ai')
  @Roles(['admin'])
  @NoApiKey()
  @TransactionAfterBody()
  @ApiOperation({
    summary:
      'Set the AI service, model and key. They are tried first, and the key is kept encrypted (admin only, never an API key)',
  })
  @ApiBody({ type: SaveAiSettingsDto })
  save(
    @Body(new ZodValidationPipe(saveAiSettingsSchema)) body: SaveAiSettingsInput,
    @Session() { user }: UserSession,
  ): Promise<AiSettingsResponse> {
    return this.settings.save(body, actorOf(user));
  }

  @Delete('ai')
  @HttpCode(204)
  @Roles(['admin'])
  @NoApiKey()
  @ApiOperation({ summary: 'Forget the AI service and its key (admin only, never an API key)' })
  remove(@Session() { user }: UserSession): Promise<void> {
    return this.settings.remove(actorOf(user));
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
  import(@UploadedFile() file: Upload | undefined): Promise<PolicyImportResponse> {
    return this.imports.read(file);
  }
}
