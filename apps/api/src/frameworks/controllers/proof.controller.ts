import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type {
  ProofByControlResponse,
  ProofOverviewResponse,
  ProofRequirementDetailResponse,
} from '@dpdp-kit/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { Roles } from '../../core/org/roles.decorator';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import {
  SaveProofRequirementDto,
  listProofByControlSchema,
  listProofSchema,
  saveProofRequirementSchema,
  type ListProofByControlInput,
  type ListProofInput,
  type SaveProofRequirementInput,
} from '../dto/proof-requirement.dto';
import { ProofService } from '../services/proof.service';

@ApiTags('Frameworks')
@ApiCookieAuth()
@Controller()
export class ProofController {
  constructor(private readonly service: ProofService) {}

  @Get('proof')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({
    summary: 'One page of what needs proof, with where each stands and the counts per tab',
  })
  @ApiQuery({
    name: 'tab',
    required: false,
    description: 'all (default), overdue, missing, due or provided',
  })
  @ApiQuery({ name: 'q', required: false, description: 'Search the proof and its control' })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'ruleId', required: false })
  @ApiQuery({ name: 'controlId', required: false, description: 'Only this control’s proof' })
  @ApiQuery({
    name: 'policyId',
    required: false,
    description: 'Only the proof of the controls this policy covers',
  })
  @ApiQuery({ name: 'page', required: false, description: 'From 1, default 1' })
  @ApiQuery({ name: 'limit', required: false, description: '1 to 100, default 25' })
  overview(
    @Query(new ZodValidationPipe(listProofSchema)) query: ListProofInput,
  ): Promise<ProofOverviewResponse> {
    return this.service.overview(query);
  }

  // Declared before `proof/:requirementId`, which would otherwise take "by-control" for an id.
  @Get('proof/by-control')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({
    summary:
      'One page of controls, each with the proof it needs and where each stands, with the counts per tab',
  })
  @ApiQuery({
    name: 'tab',
    required: false,
    description: 'all (default), overdue, missing, due or provided',
  })
  @ApiQuery({ name: 'q', required: false, description: 'Search the proof and its control' })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'ruleId', required: false })
  @ApiQuery({ name: 'page', required: false, description: 'From 1, default 1' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Controls per page, 1 to 100, default 25',
  })
  byControl(
    @Query(new ZodValidationPipe(listProofByControlSchema)) query: ListProofByControlInput,
  ): Promise<ProofByControlResponse> {
    return this.service.byControl(query);
  }

  @Get('proof/:requirementId')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'One proof requirement with its proof and the control it is for' })
  detail(@Param('requirementId') requirementId: string): Promise<ProofRequirementDetailResponse> {
    return this.service.detail(requirementId);
  }

  @Post('controls/:controlId/proof-requirements')
  @HttpCode(204)
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Add something a control needs proof of (admin and member)' })
  @ApiBody({ type: SaveProofRequirementDto })
  create(
    @Param('controlId') controlId: string,
    @Body(new ZodValidationPipe(saveProofRequirementSchema)) body: SaveProofRequirementInput,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.service.create(controlId, body, actorOf(session.user));
  }

  @Put('proof-requirements/:requirementId')
  @HttpCode(204)
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Change a proof requirement (admin and member)' })
  @ApiBody({ type: SaveProofRequirementDto })
  save(
    @Param('requirementId') requirementId: string,
    @Body(new ZodValidationPipe(saveProofRequirementSchema)) body: SaveProofRequirementInput,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.service.save(requirementId, body, actorOf(session.user));
  }

  @Post('proof-requirements/:requirementId/restore')
  @HttpCode(204)
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Bring an archived proof requirement back (admin and member)' })
  restore(
    @Param('requirementId') requirementId: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.service.restore(requirementId, actorOf(session.user));
  }

  @Delete('proof-requirements/:requirementId')
  @HttpCode(204)
  @Roles(['admin', 'member'])
  @ApiOperation({
    summary:
      'Archive a proof requirement. Proof given for it stays on the control as general proof (admin and member)',
  })
  archive(
    @Param('requirementId') requirementId: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.service.archive(requirementId, actorOf(session.user));
  }
}
