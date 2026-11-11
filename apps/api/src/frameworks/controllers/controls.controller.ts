import { Body, Controller, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ControlResponse } from '@dpdp-kit/shared';
import { Roles, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import {
  CreateControlDto,
  SaveControlDto,
  createControlSchema,
  saveControlSchema,
  type CreateControlInput,
  type SaveControlInput,
} from '../dto/control.dto';
import { ControlEditService } from '../services/control-edit.service';

@ApiTags('Frameworks')
@ApiCookieAuth()
@Roles(['admin', 'member'])
@Controller('controls')
export class ControlsController {
  constructor(private readonly service: ControlEditService) {}

  @Post()
  @ApiOperation({ summary: 'Add a control of your own under a rule (admin and member)' })
  @ApiBody({ type: CreateControlDto })
  create(
    @Body(new ZodValidationPipe(createControlSchema)) body: CreateControlInput,
    @Session() session: UserSession,
  ): Promise<ControlResponse> {
    return this.service.create(body, actorOf(session.user));
  }

  @Put(':controlId/details')
  @ApiOperation({
    summary: 'Edit a control’s text, person, review date and policies (admin and member)',
  })
  @ApiBody({ type: SaveControlDto })
  save(
    @Param('controlId') controlId: string,
    @Body(new ZodValidationPipe(saveControlSchema)) body: SaveControlInput,
    @Session() session: UserSession,
  ): Promise<ControlResponse> {
    return this.service.save(controlId, body, actorOf(session.user));
  }

  @Post(':controlId/archive')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Archive a control. It stops counting and can be restored (admin and member)',
  })
  archive(@Param('controlId') controlId: string, @Session() session: UserSession): Promise<void> {
    return this.service.archive(controlId, actorOf(session.user));
  }

  @Post(':controlId/restore')
  @HttpCode(204)
  @ApiOperation({ summary: 'Bring an archived control back (admin and member)' })
  restore(@Param('controlId') controlId: string, @Session() session: UserSession): Promise<void> {
    return this.service.restore(controlId, actorOf(session.user));
  }
}
