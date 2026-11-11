import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { BreachListResponse, BreachResponse, BreachStep } from '@dpdp-kit/shared';
import { Roles, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import {
  CompleteStepDto,
  CreateBreachDto,
  UpdateBreachDto,
  completeStepSchema,
  createBreachSchema,
  listBreachesSchema,
  stepParamSchema,
  updateBreachSchema,
  type CompleteStepInput,
  type CreateBreachInput,
  type ListBreachesQuery,
  type UpdateBreachInput,
} from '../dto/breach.dto';
import { BreachesService } from '../services/breaches.service';

@ApiTags('Breaches')
@ApiCookieAuth()
@Controller('breaches')
export class BreachesController {
  constructor(private readonly service: BreachesService) {}

  @Get()
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'One page of breaches, with the counts for the tabs' })
  @ApiQuery({ name: 'tab', required: false, description: 'open (default) or closed' })
  @ApiQuery({ name: 'q', required: false, description: 'Search title and description' })
  @ApiQuery({ name: 'page', required: false, description: 'From 1, default 1' })
  @ApiQuery({ name: 'limit', required: false, description: '1 to 100, default 25' })
  list(
    @Query(new ZodValidationPipe(listBreachesSchema)) query: ListBreachesQuery,
  ): Promise<BreachListResponse> {
    return this.service.list(query);
  }

  @Get(':id')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'One breach with all five steps and its clock' })
  get(@Param('id') id: string): Promise<BreachResponse> {
    return this.service.get(id);
  }

  @Post()
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Report a breach. It starts at the found step (admin and member)' })
  @ApiBody({ type: CreateBreachDto })
  create(
    @Body(new ZodValidationPipe(createBreachSchema)) body: CreateBreachInput,
    @Session() session: UserSession,
  ): Promise<BreachResponse> {
    return this.service.create(body, actorOf(session.user));
  }

  @Put(':id')
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Change the details of a breach while it is open (admin and member)' })
  @ApiBody({ type: UpdateBreachDto })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBreachSchema)) body: UpdateBreachInput,
    @Session() session: UserSession,
  ): Promise<BreachResponse> {
    return this.service.update(id, body, actorOf(session.user));
  }

  @Post(':id/steps/:step')
  @Roles(['admin', 'member'])
  @ApiOperation({
    summary:
      'Mark the next step done, in order. Closing needs the Board and people told (admin and member)',
  })
  @ApiBody({ type: CompleteStepDto })
  completeStep(
    @Param('id') id: string,
    @Param('step', new ZodValidationPipe(stepParamSchema)) step: BreachStep,
    @Body(new ZodValidationPipe(completeStepSchema)) body: CompleteStepInput,
    @Session() session: UserSession,
  ): Promise<BreachResponse> {
    return this.service.completeStep(id, step, body, actorOf(session.user));
  }
}
