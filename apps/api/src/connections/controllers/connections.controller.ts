import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type {
  CheckAcceptanceListResponse,
  CheckAcceptanceResponse,
  ConnectionListResponse,
  ConnectionRunListResponse,
  ConnectionRunResponse,
  ConnectionSummary,
  DiscoverGithubResponse,
  FindSubscriptionsResponse,
  GithubRepositoriesResponse,
} from '@dpdp-kit/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { actorOf } from '../../core/common/actor';
import { TransactionAfterBody } from '../../core/prisma/transaction.interceptor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { NoApiKey, Roles } from '../../core/org/roles.decorator';
import {
  CreateConnectionDto,
  DiscoverGithubDto,
  FindSubscriptionsDto,
  UpdateConnectionDto,
  UpdateScheduleDto,
  AcceptCheckDto,
  RunConnectionDto,
  UpdateGroupsDto,
  acceptCheckSchema,
  createConnectionSchema,
  discoverGithubSchema,
  findSubscriptionsSchema,
  listConnectionsSchema,
  listRunsSchema,
  runConnectionSchema,
  updateGroupsSchema,
  updateConnectionSchema,
  updateScheduleSchema,
  type AcceptCheckInput,
  type CreateConnectionInput,
  type DiscoverGithubInput,
  type FindSubscriptionsInput,
  type ListConnectionsQuery,
  type ListRunsQuery,
  type RunConnectionInput,
  type UpdateGroupsInput,
  type UpdateConnectionInput,
  type UpdateScheduleInput,
} from '../dto/connection.dto';
import { CheckAcceptanceService } from '../services/check-acceptance.service';
import { ConnectionLookupService } from '../services/connection-lookup.service';
import { ConnectionsService } from '../services/connections.service';

@ApiTags('Connections')
@ApiCookieAuth()
@Controller('connections')
export class ConnectionsController {
  constructor(
    private readonly service: ConnectionsService,
    private readonly lookup: ConnectionLookupService,
    private readonly acceptances: CheckAcceptanceService,
  ) {}

  @Get()
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'One page of connections, newest first, each with its latest run' })
  @ApiQuery({ name: 'page', required: false, description: 'From 1, default 1' })
  @ApiQuery({ name: 'limit', required: false, description: '1 to 100, default 10' })
  list(
    @Query(new ZodValidationPipe(listConnectionsSchema)) query: ListConnectionsQuery,
  ): Promise<ConnectionListResponse> {
    return this.service.list(query.page, query.limit);
  }

  // Credentials are handled by a person only: a key cannot add or remove a connection.
  // Both routes that call Azure keep out of the request-wide transaction: it would expire while they wait. Their
  // services save in a transaction of their own once the answer is in.
  @Post()
  @Roles(['admin'])
  @NoApiKey()
  @TransactionAfterBody()
  @ApiOperation({
    summary:
      'Connect a system. The details are tried first and kept encrypted, and are never sent back (admin only, never a key)',
  })
  @ApiBody({ type: CreateConnectionDto })
  create(
    @Body(new ZodValidationPipe(createConnectionSchema)) body: CreateConnectionInput,
    @Session() { user }: UserSession,
  ): Promise<ConnectionSummary> {
    return this.service.create(body, actorOf(user));
  }

  // A POST only so the secret travels in the body and not the address. It reads from Azure and saves nothing.
  @Post('subscriptions')
  @HttpCode(200)
  @Roles(['admin'])
  @NoApiKey()
  @TransactionAfterBody()
  @ApiOperation({
    summary:
      'The subscriptions an app registration can see, to choose one when connecting. Nothing is kept (admin only, never a key)',
  })
  @ApiBody({ type: FindSubscriptionsDto })
  findSubscriptions(
    @Body(new ZodValidationPipe(findSubscriptionsSchema)) body: FindSubscriptionsInput,
  ): Promise<FindSubscriptionsResponse> {
    return this.lookup.findSubscriptions(body);
  }

  @Post('github/discover')
  @HttpCode(200)
  @Roles(['admin'])
  @NoApiKey()
  @TransactionAfterBody()
  @ApiOperation({
    summary:
      'The organisations a GitHub App is installed on, with the repositories each can see, to choose from when connecting. Nothing is kept (admin only, never a key)',
  })
  @ApiBody({ type: DiscoverGithubDto })
  discoverGithub(
    @Body(new ZodValidationPipe(discoverGithubSchema)) body: DiscoverGithubInput,
  ): Promise<DiscoverGithubResponse> {
    return this.lookup.discoverGithub(body);
  }

  @Get(':id/repositories')
  @Roles(['admin'])
  @NoApiKey()
  @TransactionAfterBody()
  @ApiOperation({
    summary:
      'The repositories a GitHub connection can see, to change which it reads. Uses its own stored key (admin only, never a key)',
  })
  githubRepositories(@Param('id') id: string): Promise<GithubRepositoriesResponse> {
    return this.lookup.githubRepositories(id);
  }

  @Put(':id')
  @Roles(['admin'])
  @NoApiKey()
  @TransactionAfterBody()
  @ApiOperation({
    summary:
      'Rename a connection, replace its Azure tenant, client or secret or its GitHub private key, or change which GitHub repositories it reads. New details are tried first; the subscription or installation cannot change (admin only, never a key)',
  })
  @ApiBody({ type: UpdateConnectionDto })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateConnectionSchema)) body: UpdateConnectionInput,
    @Session() { user }: UserSession,
  ): Promise<ConnectionSummary> {
    return this.service.update(id, body, actorOf(user));
  }

  @Put(':id/schedule')
  @Roles(['admin'])
  @NoApiKey()
  @ApiOperation({
    summary:
      'Set how often a connection is checked without anyone asking: off, daily or weekly (admin only, never a key)',
  })
  @ApiBody({ type: UpdateScheduleDto })
  setSchedule(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateScheduleSchema)) body: UpdateScheduleInput,
    @Session() { user }: UserSession,
  ): Promise<ConnectionSummary> {
    return this.service.setSchedule(id, body.schedule, actorOf(user));
  }

  @Put(':id/groups')
  @Roles(['admin'])
  @NoApiKey()
  @ApiOperation({
    summary:
      'Choose which groups of checks the account runs, leaving out what it does not use. At least one stays on (admin only, never a key)',
  })
  @ApiBody({ type: UpdateGroupsDto })
  setGroups(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateGroupsSchema)) body: UpdateGroupsInput,
    @Session() { user }: UserSession,
  ): Promise<ConnectionSummary> {
    return this.service.setGroupsOff(id, body.groupsOff, actorOf(user));
  }

  @Get(':id/acceptances')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({
    summary: 'What people have accepted as deliberate on a connection, newest first',
  })
  listAcceptances(@Param('id') id: string): Promise<CheckAcceptanceListResponse> {
    return this.acceptances.list(id);
  }

  @Post(':id/acceptances')
  @Roles(['admin', 'member'])
  @ApiOperation({
    summary:
      'Accept something a check flags as deliberate, with the reason. The check still shows it; proofs fed by the check stop waiting on it (admin and member)',
  })
  @ApiBody({ type: AcceptCheckDto })
  accept(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(acceptCheckSchema)) body: AcceptCheckInput,
    @Session() { user }: UserSession,
  ): Promise<CheckAcceptanceResponse> {
    return this.acceptances.accept(id, body, actorOf(user));
  }

  @Delete(':id/acceptances/:acceptanceId')
  @HttpCode(204)
  @Roles(['admin', 'member'])
  @ApiOperation({ summary: 'Take back an acceptance (admin and member)' })
  removeAcceptance(
    @Param('id') id: string,
    @Param('acceptanceId') acceptanceId: string,
    @Session() { user }: UserSession,
  ): Promise<void> {
    return this.acceptances.remove(id, acceptanceId, actorOf(user));
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(['admin'])
  @NoApiKey()
  @ApiOperation({
    summary: 'Remove a connection and forget its credentials (admin only, never a key)',
  })
  remove(@Param('id') id: string, @Session() { user }: UserSession): Promise<void> {
    return this.service.remove(id, actorOf(user));
  }

  @Post(':id/run')
  @Roles(['admin', 'member'])
  @TransactionAfterBody()
  @ApiOperation({
    summary:
      'Read the connected system and check it now: every check, or only those named, keeping the rest as the last run found them. Takes up to about half a minute, and is not repeated within seconds (admin and member)',
  })
  @ApiBody({ type: RunConnectionDto, required: false })
  run(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(runConnectionSchema)) body: RunConnectionInput,
    @Session() { user }: UserSession,
  ): Promise<ConnectionRunResponse> {
    return this.service.run(id, actorOf(user), body?.checks);
  }

  @Get(':id')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'One connection with its latest run. The credentials are never sent' })
  get(@Param('id') id: string): Promise<ConnectionSummary> {
    return this.service.get(id);
  }

  @Get(':id/runs')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'One page of past runs of a connection, newest first, without results' })
  listRuns(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(listRunsSchema)) query: ListRunsQuery,
  ): Promise<ConnectionRunListResponse> {
    return this.service.listRuns(id, query.page, query.limit);
  }

  @Get('runs/:runId')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'One run with every result' })
  getRun(@Param('runId') runId: string): Promise<ConnectionRunResponse> {
    return this.service.getRun(runId);
  }
}
