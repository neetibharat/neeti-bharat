import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ReadinessCheckResponse, ReadinessResponse } from '@neeti-bharat/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { Roles } from '../../core/org/roles.decorator';
import {
  TakeReadinessDto,
  takeReadinessSchema,
  type TakeReadinessInput,
} from '../dto/readiness.dto';
import { ReadinessService } from '../services/readiness.service';

@ApiTags('Readiness')
@ApiCookieAuth()
@Controller('readiness')
export class ReadinessController {
  constructor(private readonly service: ReadinessService) {}

  @Get()
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({
    summary: 'The latest readiness check in full, and the scores of the recent ones',
  })
  get(): Promise<ReadinessResponse> {
    return this.service.get();
  }

  @Post()
  @Roles(['admin', 'member'])
  @ApiOperation({
    summary:
      'Take the readiness check. Every question must be answered; the score is worked out here (admin and member)',
  })
  @ApiBody({ type: TakeReadinessDto })
  take(
    @Body(new ZodValidationPipe(takeReadinessSchema)) body: TakeReadinessInput,
    @Session() session: UserSession,
  ): Promise<ReadinessCheckResponse> {
    return this.service.take(body.answers, actorOf(session.user));
  }
}
