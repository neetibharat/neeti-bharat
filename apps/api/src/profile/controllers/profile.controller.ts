import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ProfileEntryResponse, ProfileResponse } from '@dpdp-kit/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { Roles } from '../../core/org/roles.decorator';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import {
  AddProfileEntryDto,
  UpdateProfileEntryDto,
  addProfileEntrySchema,
  updateProfileEntrySchema,
  type AddProfileEntryInput,
  type UpdateProfileEntryInput,
} from '../dto/profile.dto';
import { ProfileService } from '../services/profile.service';

@ApiTags('Company profile')
@ApiCookieAuth()
@Roles(['admin'])
@Controller('profile')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Every answer about the company, built-in and added (admin only)' })
  list(): Promise<ProfileResponse> {
    return this.service.list();
  }

  @Put('entries/:key')
  @ApiOperation({
    summary: 'Change an answer. A legal limit also needs confirmed: true (admin only)',
  })
  @ApiBody({ type: UpdateProfileEntryDto })
  update(
    @Param('key') key: string,
    @Body(new ZodValidationPipe(updateProfileEntrySchema)) body: UpdateProfileEntryInput,
    @Session() session: UserSession,
  ): Promise<ProfileEntryResponse> {
    return this.service.update(key, body, actorOf(session.user));
  }

  @Post('entries')
  @ApiOperation({ summary: 'Add an answer of your own, such as an office address (admin only)' })
  @ApiBody({ type: AddProfileEntryDto })
  add(
    @Body(new ZodValidationPipe(addProfileEntrySchema)) body: AddProfileEntryInput,
    @Session() session: UserSession,
  ): Promise<ProfileEntryResponse> {
    return this.service.addCustom(body, actorOf(session.user));
  }

  @Delete('entries/:key')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Remove an answer you added. Built-in answers cannot be removed (admin only)',
  })
  remove(@Param('key') key: string, @Session() session: UserSession): Promise<void> {
    return this.service.removeCustom(key, actorOf(session.user));
  }
}
