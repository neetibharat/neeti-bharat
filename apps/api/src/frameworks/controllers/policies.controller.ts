import { Body, Controller, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  PolicyCoverageResponse,
  PolicyDetailResponse,
  PolicyListResponse,
  PolicyVersionResponse,
} from '@neeti-bharat/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { Roles } from '../../core/org/roles.decorator';
import { actorOf } from '../../core/common/actor';
import { currentRole } from '../../core/org/org-context';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import {
  versionSchema,
  ChangePolicyStatusDto,
  CreatePolicyDto,
  SavePolicyContentDto,
  SavePolicyDto,
  SetPolicyApproverDto,
  changePolicyStatusSchema,
  createPolicySchema,
  savePolicyContentSchema,
  savePolicySchema,
  setPolicyApproverSchema,
  type ChangePolicyStatusInput,
  type CreatePolicyInput,
  type SavePolicyContentInput,
  type SavePolicyInput,
  type SetPolicyApproverInput,
} from '../dto/policy.dto';
import { FrameworksService } from '../services/frameworks.service';
import { PoliciesService } from '../services/policies.service';
import { PolicyEditService } from '../services/policy-edit.service';

const viewerOf = ({ user }: UserSession) => ({
  email: user.email,
  isAdmin: currentRole() === 'admin',
});
const policyActorOf = (session: UserSession) => ({
  ...actorOf(session.user),
  ...viewerOf(session),
});

@ApiTags('Policies')
@ApiCookieAuth()
@Controller('policies')
export class PoliciesController {
  constructor(
    private readonly service: PoliciesService,
    private readonly frameworks: FrameworksService,
    private readonly editing: PolicyEditService,
  ) {}

  @Get()
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'Every policy, with where it stands' })
  list(): Promise<PolicyListResponse> {
    return this.service.list();
  }

  @Get('archived')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'Policies that were archived, which can be restored' })
  archived(): Promise<PolicyListResponse> {
    return this.editing.archived();
  }

  @Post()
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Add a policy of your own, as a draft (admin and member)' })
  @ApiBody({ type: CreatePolicyDto })
  create(
    @Body(new ZodValidationPipe(createPolicySchema)) body: CreatePolicyInput,
    @Session() session: UserSession,
  ): Promise<PolicyDetailResponse> {
    return this.editing.create(body, policyActorOf(session));
  }

  @Put(':policyId/details')
  @Roles(['admin', 'member'])
  @ApiOperation({
    summary: 'Edit a policy’s title, summary, owner and approver title (admin and member)',
  })
  @ApiBody({ type: SavePolicyDto })
  saveDetails(
    @Param('policyId') policyId: string,
    @Body(new ZodValidationPipe(savePolicySchema)) body: SavePolicyInput,
    @Session() session: UserSession,
  ): Promise<PolicyDetailResponse> {
    return this.editing.save(policyId, body, policyActorOf(session));
  }

  @Post(':policyId/archive')
  @HttpCode(204)
  @Roles(['admin', 'member'])
  @ApiOperation({
    summary: 'Archive a policy. It stops counting and can be restored (admin and member)',
  })
  archive(@Param('policyId') policyId: string, @Session() session: UserSession): Promise<void> {
    return this.editing.archive(policyId, actorOf(session.user));
  }

  @Post(':policyId/restore')
  @HttpCode(204)
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Bring an archived policy back (admin and member)' })
  restore(@Param('policyId') policyId: string, @Session() session: UserSession): Promise<void> {
    return this.editing.restore(policyId, actorOf(session.user));
  }

  @Get(':policyId')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'One policy with its text, approval history and where it stands' })
  detail(
    @Param('policyId') policyId: string,
    @Session() session: UserSession,
  ): Promise<PolicyDetailResponse> {
    return this.service.detail(policyId, viewerOf(session));
  }

  @Get(':policyId/coverage')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'Every control a policy covers, across all frameworks' })
  coverage(@Param('policyId') policyId: string): Promise<PolicyCoverageResponse> {
    return this.frameworks.policyCoverage(policyId);
  }

  @Get(':policyId/versions/:version')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'The text of one approved version of a policy' })
  version(
    @Param('policyId') policyId: string,
    @Param('version', new ZodValidationPipe(versionSchema)) version: number,
  ): Promise<PolicyVersionResponse> {
    return this.service.version(policyId, version);
  }

  @Put(':policyId/content')
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Save the policy text. Only a draft can be edited (admin and member)' })
  @ApiBody({ type: SavePolicyContentDto })
  saveContent(
    @Param('policyId') policyId: string,
    @Body(new ZodValidationPipe(savePolicyContentSchema)) body: SavePolicyContentInput,
    @Session() session: UserSession,
  ): Promise<PolicyDetailResponse> {
    return this.service.saveContent(policyId, body.content, policyActorOf(session));
  }

  @Put(':policyId/approver')
  @Roles(['admin'])
  @ApiOperation({ summary: 'Name the person who must approve the policy (admin only)' })
  @ApiBody({ type: SetPolicyApproverDto })
  setApprover(
    @Param('policyId') policyId: string,
    @Body(new ZodValidationPipe(setPolicyApproverSchema)) body: SetPolicyApproverInput,
    @Session() session: UserSession,
  ): Promise<PolicyDetailResponse> {
    return this.service.setApprover(policyId, body.approverId, policyActorOf(session));
  }

  @Put(':policyId/status')
  @Roles(['admin', 'member'])
  @ApiOperation({
    summary:
      'Ask for approval, or approve, send back or reopen. Deciding is for the named approver, or an admin when none is named',
  })
  @ApiBody({ type: ChangePolicyStatusDto })
  changeStatus(
    @Param('policyId') policyId: string,
    @Body(new ZodValidationPipe(changePolicyStatusSchema)) body: ChangePolicyStatusInput,
    @Session() session: UserSession,
  ): Promise<PolicyDetailResponse> {
    return this.service.changeStatus(policyId, body.status, policyActorOf(session), body.changelog);
  }
}
