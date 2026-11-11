import { Body, Controller, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ChecklistResponse, FrameworkListResponse, RulePageResponse } from '@dpdp-kit/shared';
import { Roles, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import {
  SaveFrameworkDto,
  SaveRequirementDto,
  saveFrameworkSchema,
  saveRequirementSchema,
  type SaveFrameworkInput,
  type SaveRequirementInput,
} from '../dto/framework.dto';
import { FrameworkEditService } from '../services/framework-edit.service';
import { FrameworksService } from '../services/frameworks.service';

@ApiTags('Frameworks')
@ApiCookieAuth()
@Controller('frameworks')
export class FrameworksController {
  constructor(
    private readonly service: FrameworksService,
    private readonly editing: FrameworkEditService,
  ) {}

  @Get()
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'The frameworks the company follows, with how far along each is' })
  list(): Promise<FrameworkListResponse> {
    return this.service.list();
  }

  @Post()
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Add a framework of your own (admin and member)' })
  @ApiBody({ type: SaveFrameworkDto })
  create(
    @Body(new ZodValidationPipe(saveFrameworkSchema)) body: SaveFrameworkInput,
    @Session() session: UserSession,
  ): Promise<{ id: string }> {
    return this.editing.create(body, actorOf(session.user));
  }

  @Get(':frameworkId')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'One framework: its rules and their controls, with status and owner' })
  checklist(@Param('frameworkId') frameworkId: string): Promise<ChecklistResponse> {
    return this.service.checklist(frameworkId);
  }

  @Get(':frameworkId/rules/:ruleId')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'One rule with its controls, and only the policies that cover them' })
  rulePage(
    @Param('frameworkId') frameworkId: string,
    @Param('ruleId') ruleId: string,
  ): Promise<RulePageResponse> {
    return this.service.rulePage(frameworkId, ruleId);
  }

  @Put(':frameworkId')
  @HttpCode(204)
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Change a framework you made. Built-in ones cannot change' })
  @ApiBody({ type: SaveFrameworkDto })
  update(
    @Param('frameworkId') frameworkId: string,
    @Body(new ZodValidationPipe(saveFrameworkSchema)) body: SaveFrameworkInput,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.editing.update(frameworkId, body, actorOf(session.user));
  }

  @Post(':frameworkId/archive')
  @HttpCode(204)
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Archive a framework you made, once its controls are archived' })
  archive(
    @Param('frameworkId') frameworkId: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.editing.archive(frameworkId, actorOf(session.user));
  }

  @Post(':frameworkId/requirements')
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Add a rule to a framework you made (admin and member)' })
  @ApiBody({ type: SaveRequirementDto })
  createRequirement(
    @Param('frameworkId') frameworkId: string,
    @Body(new ZodValidationPipe(saveRequirementSchema)) body: SaveRequirementInput,
    @Session() session: UserSession,
  ): Promise<{ id: string }> {
    return this.editing.createRequirement(frameworkId, body, actorOf(session.user));
  }
}
