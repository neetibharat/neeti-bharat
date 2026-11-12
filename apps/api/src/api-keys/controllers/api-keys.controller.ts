import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { ApiKeyListResponse, CreatedApiKeyResponse } from '@dpdp-kit/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { NoApiKey, Roles } from '../../core/org/roles.decorator';
import {
  CreateApiKeyDto,
  createApiKeySchema,
  listApiKeysSchema,
  type CreateApiKeyInput,
  type ListApiKeysQuery,
} from '../dto/api-key.dto';
import { ApiKeysService } from '../services/api-keys.service';

// Admin only, and only a person: a request signed in with a key is refused, so a leaked key cannot make more keys.
@NoApiKey()
@ApiTags('API keys')
@ApiCookieAuth()
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly service: ApiKeysService) {}

  @Get()
  @Roles(['admin'])
  @ApiOperation({ summary: 'One page of the organisation API keys, newest first (admin only)' })
  @ApiQuery({ name: 'page', required: false, description: 'From 1, default 1' })
  @ApiQuery({ name: 'limit', required: false, description: '1 to 100, default 10' })
  list(
    @Query(new ZodValidationPipe(listApiKeysSchema)) query: ListApiKeysQuery,
  ): Promise<ApiKeyListResponse> {
    return this.service.list(query.page, query.limit);
  }

  @Post()
  @Roles(['admin'])
  @ApiOperation({
    summary:
      'Make a key for scripts and AI agents. The key is in the answer once and cannot be read again (admin only)',
  })
  @ApiBody({ type: CreateApiKeyDto })
  create(
    @Body(new ZodValidationPipe(createApiKeySchema)) body: CreateApiKeyInput,
    @Session() session: UserSession,
  ): Promise<CreatedApiKeyResponse> {
    return this.service.create(body, actorOf(session.user));
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(['admin'])
  @ApiOperation({ summary: 'Revoke a key. It stops working at once (admin only)' })
  revoke(@Param('id') id: string, @Session() session: UserSession): Promise<void> {
    return this.service.revoke(id, actorOf(session.user));
  }
}
