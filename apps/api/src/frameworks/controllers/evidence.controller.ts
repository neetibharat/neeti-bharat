import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { EvidenceListResponse, EvidenceResponse } from '@dpdp-kit/shared';
import { Roles, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { AddEvidenceDto, addEvidenceSchema, type AddEvidenceInput } from '../dto/evidence.dto';
import { EvidenceService } from '../services/evidence.service';

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
  @ApiOperation({ summary: 'Attach a link or a note as proof (admin and member)' })
  @ApiBody({ type: AddEvidenceDto })
  add(
    @Param('controlId') controlId: string,
    @Body(new ZodValidationPipe(addEvidenceSchema)) body: AddEvidenceInput,
    @Session() session: UserSession,
  ): Promise<EvidenceResponse> {
    return this.service.add(controlId, body, actorOf(session.user));
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
