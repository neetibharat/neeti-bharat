import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type {
  MyTrainingResponse,
  TeamTrainingResponse,
  TrainingListResponse,
  TrainingResponse,
} from '@dpdp-kit/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { Roles } from '../../core/org/roles.decorator';
import {
  AddTrainingDto,
  CompleteTrainingDto,
  UpdateTrainingDto,
  addTrainingSchema,
  completeTrainingSchema,
  listTeamSchema,
  updateTrainingSchema,
  type AddTrainingInput,
  type CompleteTrainingInput,
  type ListTeamQuery,
  type UpdateTrainingInput,
} from '../dto/training.dto';
import { TrainingService } from '../services/training.service';

@ApiTags('Training')
@ApiCookieAuth()
@Controller('trainings')
export class TrainingController {
  constructor(private readonly service: TrainingService) {}

  @Get()
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'Every training, with how many people have taken it' })
  list(): Promise<TrainingListResponse> {
    return this.service.list();
  }

  @Get('mine')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'The trainings in use, with the day the signed-in person took each' })
  mine(@Session() { user }: UserSession): Promise<MyTrainingResponse> {
    return this.service.mine(user);
  }

  @Get('of/:personId')
  @Roles(['admin', 'auditor'])
  @ApiOperation({ summary: 'The trainings in use, with the day one person took each' })
  of(@Param('personId') personId: string): Promise<MyTrainingResponse> {
    return this.service.forPerson(personId);
  }

  @Get('team')
  @Roles(['admin', 'auditor'])
  @ApiOperation({ summary: 'One page of the people, with how far each has got' })
  @ApiQuery({ name: 'q', required: false, description: 'Search name or email' })
  @ApiQuery({ name: 'page', required: false, description: 'From 1, default 1' })
  @ApiQuery({ name: 'limit', required: false, description: '1 to 100, default 25' })
  team(
    @Query(new ZodValidationPipe(listTeamSchema)) query: ListTeamQuery,
  ): Promise<TeamTrainingResponse> {
    return this.service.team(query);
  }

  @Post()
  @Roles(['admin'])
  @ApiOperation({ summary: 'Add a training (admin)' })
  @ApiBody({ type: AddTrainingDto })
  add(
    @Body(new ZodValidationPipe(addTrainingSchema)) body: AddTrainingInput,
    @Session() { user }: UserSession,
  ): Promise<TrainingResponse> {
    return this.service.add(body, actorOf(user));
  }

  @Post('starters')
  @Roles(['admin'])
  @ApiOperation({ summary: 'Add the suggested trainings the company does not have yet (admin)' })
  starters(@Session() { user }: UserSession): Promise<TrainingListResponse> {
    return this.service.addStarters(actorOf(user));
  }

  @Patch(':id')
  @Roles(['admin'])
  @ApiOperation({ summary: 'Change a training that is in use (admin)' })
  @ApiBody({ type: UpdateTrainingDto })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTrainingSchema)) body: UpdateTrainingInput,
    @Session() { user }: UserSession,
  ): Promise<TrainingResponse> {
    return this.service.update(id, body, actorOf(user));
  }

  @Post(':id/archive')
  @Roles(['admin'])
  @ApiOperation({ summary: 'Stop asking for a training. Who took it stays on record (admin)' })
  archive(@Param('id') id: string, @Session() { user }: UserSession): Promise<TrainingResponse> {
    return this.service.archive(id, actorOf(user), new Date());
  }

  @Post(':id/restore')
  @Roles(['admin'])
  @ApiOperation({ summary: 'Ask for an archived training again (admin)' })
  restore(@Param('id') id: string, @Session() { user }: UserSession): Promise<TrainingResponse> {
    return this.service.restore(id, actorOf(user));
  }

  @Post(':id/complete')
  @Roles(['admin', 'member'])
  @ApiOperation({
    summary: 'Record that you have taken a training. An admin can record it for someone',
  })
  @ApiBody({ type: CompleteTrainingDto })
  complete(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(completeTrainingSchema)) body: CompleteTrainingInput,
    @Session() { user }: UserSession,
  ): Promise<MyTrainingResponse> {
    return this.service.complete(id, body.personId, user, actorOf(user), new Date());
  }

  @Delete(':id/complete')
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Take back a completion. An admin can do it for someone' })
  @ApiQuery({ name: 'personId', required: false, description: 'Admins only' })
  reopen(
    @Param('id') id: string,
    @Query('personId') personId: string | undefined,
    @Session() { user }: UserSession,
  ): Promise<MyTrainingResponse> {
    return this.service.reopen(id, personId, user, actorOf(user));
  }
}
