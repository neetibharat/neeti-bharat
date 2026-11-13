import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type {
  NotificationListResponse,
  NotificationPreferencesResponse,
  NotificationRoleDefaultsResponse,
  NotificationUnreadResponse,
} from '@dpdp-kit/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { currentRole } from '../../core/org/org-context';
import { Roles } from '../../core/org/roles.decorator';
import {
  UpdatePreferencesDto,
  UpdateRoleDefaultsDto,
  listNotificationsSchema,
  updatePreferencesSchema,
  updateRoleDefaultsSchema,
  type ListNotificationsQuery,
  type UpdatePreferencesInput,
  type UpdateRoleDefaultsInput,
} from '../dto/notification.dto';
import { NotificationsService } from '../services/notifications.service';

// Everyone who can open the organisation, auditors too: these are a person's own notices, not company records.
@ApiTags('Notifications')
@ApiCookieAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({
    summary: 'One page of your notifications, newest first, with how many are unread',
  })
  @ApiQuery({ name: 'page', required: false, description: 'From 1, default 1' })
  @ApiQuery({ name: 'limit', required: false, description: '1 to 100, default 20' })
  @ApiQuery({ name: 'unread', required: false, description: 'true for unread ones only' })
  list(
    @Query(new ZodValidationPipe(listNotificationsSchema)) query: ListNotificationsQuery,
    @Session() session: UserSession,
  ): Promise<NotificationListResponse> {
    return this.service.list(session.user.id, query.page, query.limit, query.unread);
  }

  @Get('unread-count')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'How many notifications you have not read' })
  unread(@Session() session: UserSession): Promise<NotificationUnreadResponse> {
    return this.service.unread(session.user.id);
  }

  @Get('preferences')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({
    summary: 'How you hear about each kind of notice: in the app, by email, or both',
  })
  preferences(@Session() session: UserSession): Promise<NotificationPreferencesResponse> {
    return this.service.getPreferences(session.user.id, currentRole() ?? 'member');
  }

  @Put('preferences')
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'Choose how you hear about each kind of notice' })
  @ApiBody({ type: UpdatePreferencesDto })
  updatePreferences(
    @Body(new ZodValidationPipe(updatePreferencesSchema)) body: UpdatePreferencesInput,
    @Session() session: UserSession,
  ): Promise<NotificationPreferencesResponse> {
    return this.service.updatePreferences(session.user.id, currentRole() ?? 'member', body);
  }

  @Get('role-defaults')
  @Roles(['admin'])
  @ApiOperation({ summary: 'What each role gets for each kind of notice (admin only)' })
  roleDefaults(): Promise<NotificationRoleDefaultsResponse> {
    return this.service.getRoleDefaults();
  }

  @Put('role-defaults')
  @Roles(['admin'])
  @ApiOperation({
    summary: 'Set what each role gets until a person chooses otherwise (admin only)',
  })
  @ApiBody({ type: UpdateRoleDefaultsDto })
  updateRoleDefaults(
    @Body(new ZodValidationPipe(updateRoleDefaultsSchema)) body: UpdateRoleDefaultsInput,
    @Session() session: UserSession,
  ): Promise<NotificationRoleDefaultsResponse> {
    return this.service.updateRoleDefaults(body, actorOf(session.user));
  }

  @Post('read-all')
  @HttpCode(204)
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'Mark all your notifications as read' })
  readAll(@Session() session: UserSession): Promise<void> {
    return this.service.markAllRead(session.user.id);
  }

  @Post(':id/read')
  @HttpCode(204)
  @Roles(['admin', 'member', 'auditor'])
  @ApiOperation({ summary: 'Mark one of your notifications as read' })
  read(@Param('id') id: string, @Session() session: UserSession): Promise<void> {
    return this.service.markRead(session.user.id, id);
  }
}
