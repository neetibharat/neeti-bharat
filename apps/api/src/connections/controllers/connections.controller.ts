import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type {
  ConnectionListResponse,
  ConnectionRunListResponse,
  ConnectionRunResponse,
  ConnectionSummary,
} from '@dpdp-kit/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { actorOf } from '../../core/common/actor';
import { TransactionAfterBody } from '../../core/prisma/transaction.interceptor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { NoApiKey, Roles } from '../../core/org/roles.decorator';
import {
  CreateConnectionDto,
  createConnectionSchema,
  listConnectionsSchema,
  listRunsSchema,
  type CreateConnectionInput,
  type ListConnectionsQuery,
  type ListRunsQuery,
} from '../dto/connection.dto';
import { ConnectionsService } from '../services/connections.service';

@ApiTags('Connections')
@ApiCookieAuth()
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly service: ConnectionsService) {}

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
      'Read the connected system and check it now. Takes up to about half a minute, and is not repeated within seconds (admin and member)',
  })
  run(@Param('id') id: string, @Session() { user }: UserSession): Promise<ConnectionRunResponse> {
    return this.service.run(id, actorOf(user));
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
