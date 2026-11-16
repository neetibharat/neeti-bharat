import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { WebsiteCheckListResponse, WebsiteCheckResponse } from '@dpdp-kit/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { Roles } from '../../core/org/roles.decorator';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import {
  RunWebsiteCheckDto,
  listWebsiteChecksSchema,
  runWebsiteCheckSchema,
  type ListWebsiteChecksQuery,
  type RunWebsiteCheckInput,
} from '../dto/website-check.dto';
import { WebsiteChecksService } from '../services/website-checks.service';

@ApiTags('Website checks')
@ApiCookieAuth()
@Controller('website-checks')
export class WebsiteChecksController {
  constructor(private readonly service: WebsiteChecksService) {}

  @Get()
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'One page of past checks, newest first, without their results' })
  @ApiQuery({ name: 'page', required: false, description: 'From 1, default 1' })
  @ApiQuery({ name: 'limit', required: false, description: '1 to 100, default 10' })
  list(
    @Query(new ZodValidationPipe(listWebsiteChecksSchema)) query: ListWebsiteChecksQuery,
  ): Promise<WebsiteCheckListResponse> {
    return this.service.list(query.page, query.limit);
  }

  @Get(':id')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'One check with every result' })
  get(@Param('id') id: string): Promise<WebsiteCheckResponse> {
    return this.service.get(id);
  }

  @Post()
  @Roles(['admin', 'member'])
  @ApiOperation({
    summary:
      'Visit a site and check it now. Takes up to about ten seconds. An address that is not public is refused (admin and member)',
  })
  @ApiBody({ type: RunWebsiteCheckDto })
  run(
    @Body(new ZodValidationPipe(runWebsiteCheckSchema)) body: RunWebsiteCheckInput,
    @Session() session: UserSession,
  ): Promise<WebsiteCheckResponse> {
    return this.service.run(body.url, actorOf(session.user));
  }
}
