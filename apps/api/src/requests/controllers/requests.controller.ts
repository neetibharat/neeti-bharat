import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type {
  RequestAttentionResponse,
  RequestBoardResponse,
  RequestListResponse,
  RequestResponse,
} from '@dpdp-kit/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { Roles } from '../../core/org/roles.decorator';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import {
  AddTaskDto,
  CloseRequestDto,
  CreateRequestDto,
  UpdateRequestDto,
  UpdateTaskDto,
  VerifyIdentityDto,
  addTaskSchema,
  boardRequestsSchema,
  closeRequestSchema,
  createRequestSchema,
  listRequestsSchema,
  updateRequestSchema,
  updateTaskSchema,
  verifyIdentitySchema,
  type AddTaskInput,
  type BoardRequestsQuery,
  type CloseRequestInput,
  type CreateRequestInput,
  type ListRequestsQuery,
  type UpdateRequestInput,
  type UpdateTaskInput,
  type VerifyIdentityInput,
} from '../dto/request.dto';
import { RequestsService } from '../services/requests.service';

@ApiTags('Requests')
@ApiCookieAuth()
@Controller('requests')
export class RequestsController {
  constructor(private readonly service: RequestsService) {}

  @Get()
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'One page of requests, with the counts for the tabs' })
  @ApiQuery({ name: 'tab', required: false, description: 'new (default), in_progress or done' })
  @ApiQuery({ name: 'type', required: false, description: 'Only this type of request' })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search REQ number, name, email and details',
  })
  @ApiQuery({ name: 'page', required: false, description: 'From 1, default 1' })
  @ApiQuery({ name: 'limit', required: false, description: '1 to 100, default 25' })
  list(
    @Query(new ZodValidationPipe(listRequestsSchema)) query: ListRequestsQuery,
  ): Promise<RequestListResponse> {
    return this.service.list(query);
  }

  @Get('board')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({
    summary: 'The latest requests in each column of the board, with the counts for the columns',
  })
  @ApiQuery({ name: 'type', required: false, description: 'Only this type of request' })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search REQ number, name, email and details',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Cards per column, 1 to 50, default 10',
  })
  board(
    @Query(new ZodValidationPipe(boardRequestsSchema)) query: BoardRequestsQuery,
  ): Promise<RequestBoardResponse> {
    return this.service.board(query);
  }

  @Get('attention')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'Up to five open requests that are late or due within a week' })
  attention(): Promise<RequestAttentionResponse> {
    return this.service.attention();
  }

  @Get(':id')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'One request with its tasks' })
  get(@Param('id') id: string): Promise<RequestResponse> {
    return this.service.get(id);
  }

  @Post()
  @Roles(['admin', 'member'])
  @ApiOperation({
    summary: 'Log a request. The due date is set from the reply time (admin and member)',
  })
  @ApiBody({ type: CreateRequestDto })
  create(
    @Body(new ZodValidationPipe(createRequestSchema)) body: CreateRequestInput,
    @Session() session: UserSession,
  ): Promise<RequestResponse> {
    return this.service.create(body, actorOf(session.user));
  }

  @Put(':id')
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Change the details of a request while it is open (admin and member)' })
  @ApiBody({ type: UpdateRequestDto })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRequestSchema)) body: UpdateRequestInput,
    @Session() session: UserSession,
  ): Promise<RequestResponse> {
    return this.service.update(id, body, actorOf(session.user));
  }

  @Post(':id/identity')
  @Roles(['admin', 'member'])
  @ApiOperation({
    summary: 'Record that the identity is checked. Work can start (admin and member)',
  })
  @ApiBody({ type: VerifyIdentityDto })
  verifyIdentity(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(verifyIdentitySchema)) body: VerifyIdentityInput,
    @Session() session: UserSession,
  ): Promise<RequestResponse> {
    return this.service.verifyIdentity(id, body, actorOf(session.user));
  }

  @Post(':id/tasks')
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Add a system that holds the data as a task (admin and member)' })
  @ApiBody({ type: AddTaskDto })
  addTask(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addTaskSchema)) body: AddTaskInput,
    @Session() session: UserSession,
  ): Promise<RequestResponse> {
    return this.service.addTask(id, body, actorOf(session.user));
  }

  @Put(':id/tasks/:taskId')
  @Roles(['admin', 'member'])
  @ApiOperation({
    summary: 'Set what came of a task. Needs the identity checked; kept by law needs a reason',
  })
  @ApiBody({ type: UpdateTaskDto })
  updateTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body(new ZodValidationPipe(updateTaskSchema)) body: UpdateTaskInput,
    @Session() session: UserSession,
  ): Promise<RequestResponse> {
    return this.service.updateTask(id, taskId, body, actorOf(session.user));
  }

  @Delete(':id/tasks/:taskId')
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Remove a task that is still to do (admin and member)' })
  removeTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Session() session: UserSession,
  ): Promise<RequestResponse> {
    return this.service.removeTask(id, taskId, actorOf(session.user));
  }

  @Post(':id/close')
  @Roles(['admin', 'member'])
  @ApiOperation({
    summary: 'Close the request with the reply. Needs the identity checked and no task to do',
  })
  @ApiBody({ type: CloseRequestDto })
  close(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(closeRequestSchema)) body: CloseRequestInput,
    @Session() session: UserSession,
  ): Promise<RequestResponse> {
    return this.service.close(id, body, actorOf(session.user));
  }
}
