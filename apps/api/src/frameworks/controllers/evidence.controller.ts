import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  EVIDENCE_FILE_MAX_BYTES,
  type EvidenceDownloadResponse,
  type EvidenceListResponse,
  type EvidenceResponse,
} from '@neeti-bharat/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { Roles } from '../../core/org/roles.decorator';
import { actorOf } from '../../core/common/actor';
import {
  BodyFirstTransactionInterceptor,
  TransactionAfterBody,
} from '../../core/prisma/transaction.interceptor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import {
  AddEvidenceDto,
  AddEvidenceFileDto,
  addEvidenceFileSchema,
  addEvidenceSchema,
  type AddEvidenceFileInput,
  type AddEvidenceInput,
} from '../dto/evidence.dto';
import { EvidenceService } from '../services/evidence.service';
import type { UploadedFile as Upload } from '../utils/evidence-file';

// Memory storage (multer's default): the file is checked and sent on in one step, and nothing is left on disk.
const UPLOAD = {
  limits: { fileSize: EVIDENCE_FILE_MAX_BYTES, files: 1, fields: 5 },
  // Browsers send file names as UTF-8; multer would otherwise read them as Latin-1.
  defParamCharset: 'utf8',
};

@ApiTags('Frameworks')
@ApiCookieAuth()
@Controller('controls/:controlId/evidence')
export class EvidenceController {
  constructor(private readonly service: EvidenceService) {}

  @Get()
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'The proof attached to a control, newest first' })
  list(@Param('controlId') controlId: string): Promise<EvidenceListResponse> {
    return this.service.list(controlId);
  }

  @Post()
  @Roles(['admin', 'member'])
  @ApiOperation({
    summary: 'Attach a link or a note as proof (admin and member). Files go to POST .../files',
  })
  @ApiBody({ type: AddEvidenceDto })
  add(
    @Param('controlId') controlId: string,
    @Body(new ZodValidationPipe(addEvidenceSchema)) body: AddEvidenceInput,
    @Session() session: UserSession,
  ): Promise<EvidenceResponse> {
    return this.service.add(controlId, body, actorOf(session.user));
  }

  @Post('files')
  @Roles(['admin', 'member'])
  @TransactionAfterBody()
  @UseInterceptors(FileInterceptor('file', UPLOAD), BodyFirstTransactionInterceptor)
  @ApiOperation({ summary: 'Attach a file as proof (admin and member)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AddEvidenceFileDto })
  addFile(
    @Param('controlId') controlId: string,
    @UploadedFile() file: Upload | undefined,
    @Body(new ZodValidationPipe(addEvidenceFileSchema)) body: AddEvidenceFileInput,
    @Session() session: UserSession,
  ): Promise<EvidenceResponse> {
    return this.service.addFile(controlId, body, file, actorOf(session.user));
  }

  @Get(':evidenceId/download')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'A link that downloads a proof file, valid for five minutes' })
  download(
    @Param('controlId') controlId: string,
    @Param('evidenceId') evidenceId: string,
  ): Promise<EvidenceDownloadResponse> {
    return this.service.download(controlId, evidenceId);
  }

  @Delete(':evidenceId')
  @HttpCode(204)
  @Roles(['admin', 'member'])
  @ApiOperation({
    summary:
      'Remove a piece of proof. Removing the last one sends a done control back to in progress (admin and member)',
  })
  remove(
    @Param('controlId') controlId: string,
    @Param('evidenceId') evidenceId: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.service.remove(controlId, evidenceId, actorOf(session.user));
  }
}
