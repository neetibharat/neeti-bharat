import { Body, Controller, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import {
  SaveRequirementDto,
  saveRequirementSchema,
  type SaveRequirementInput,
} from '../dto/framework.dto';
import { FrameworkEditService } from '../services/framework-edit.service';

@ApiTags('Frameworks')
@ApiCookieAuth()
@Controller('requirements')
export class RequirementsController {
  constructor(private readonly editing: FrameworkEditService) {}

  @Put(':requirementId')
  @HttpCode(204)
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Change a rule of a framework you made. Built-in rules cannot change' })
  @ApiBody({ type: SaveRequirementDto })
  update(
    @Param('requirementId') requirementId: string,
    @Body(new ZodValidationPipe(saveRequirementSchema)) body: SaveRequirementInput,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.editing.updateRequirement(requirementId, body, actorOf(session.user));
  }

  @Post(':requirementId/archive')
  @HttpCode(204)
  @Roles(['admin', 'member'])
  @ApiOperation({
    summary: 'Archive a rule of a framework you made, once its controls are archived',
  })
  archive(
    @Param('requirementId') requirementId: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.editing.archiveRequirement(requirementId, actorOf(session.user));
  }
}
