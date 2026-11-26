import { Injectable } from '@nestjs/common';
import {
  APP_ROLES,
  NOTIFICATION_KINDS,
  type AppRole,
  type NotificationListResponse,
  type NotificationPreferencesResponse,
  type NotificationRoleDefaultsResponse,
  type NotificationUnreadResponse,
} from '@neeti-bharat/shared';
import { ActivityService } from '../../activity/services/activity.service';
import type { Actor } from '../../core/common/actor';
import type { UpdatePreferencesInput, UpdateRoleDefaultsInput } from '../dto/notification.dto';
import { NotificationRepository } from '../repositories/notification.repository';
import { PreferenceRepository } from '../repositories/preference.repository';
import { choiceResolver } from '../utils/choices';
import { toNotificationSummary } from '../utils/notification-mapper';

/** A person's own notices and how they want to hear about them. Nobody can read or change another person's. */
@Injectable()
export class NotificationsService {
  constructor(
    private readonly notices: NotificationRepository,
    private readonly preferences: PreferenceRepository,
    private readonly activity: ActivityService,
  ) {}

  async list(
    userId: string,
    page: number,
    limit: number,
    unreadOnly: boolean,
  ): Promise<NotificationListResponse> {
    const [{ rows, total }, unread] = await Promise.all([
      this.notices.list(userId, page, limit, unreadOnly),
      this.notices.countUnread(userId),
    ]);
    return { items: rows.map(toNotificationSummary), total, page, pageSize: limit, unread };
  }

  async unread(userId: string): Promise<NotificationUnreadResponse> {
    return { unread: await this.notices.countUnread(userId) };
  }

  markRead(userId: string, id: string): Promise<void> {
    return this.notices.markRead(userId, id, new Date());
  }

  markAllRead(userId: string): Promise<void> {
    return this.notices.markAllRead(userId, new Date());
  }

  /** Every kind as it works for this person: their own choice, else their role's default, else on. */
  async getPreferences(userId: string, role: AppRole): Promise<NotificationPreferencesResponse> {
    const [own, defaults] = await Promise.all([
      this.preferences.forUsers([userId]),
      this.preferences.roleDefaults(),
    ]);
    const choose = choiceResolver(own, defaults);
    return { items: NOTIFICATION_KINDS.map((kind) => ({ kind, ...choose(role, kind) })) };
  }

  async updatePreferences(
    userId: string,
    role: AppRole,
    input: UpdatePreferencesInput,
  ): Promise<NotificationPreferencesResponse> {
    await this.preferences.save(userId, input.items);
    return this.getPreferences(userId, role);
  }

  /** What each role gets, for every role and kind. */
  async getRoleDefaults(): Promise<NotificationRoleDefaultsResponse> {
    const saved = await this.preferences.roleDefaults();
    return {
      items: APP_ROLES.flatMap((role) =>
        NOTIFICATION_KINDS.map((kind) => {
          const found = saved.find((row) => row.role === role && row.kind === kind);
          return { role, kind, inApp: found?.inApp ?? true, email: found?.email ?? true };
        }),
      ),
    };
  }

  async updateRoleDefaults(
    input: UpdateRoleDefaultsInput,
    actor: Actor,
  ): Promise<NotificationRoleDefaultsResponse> {
    await this.preferences.saveRoleDefaults(input.items);
    await this.activity.record({
      actor,
      action: 'NOTIFICATION_DEFAULTS_CHANGED',
      subject: { type: 'notification_defaults' },
      details: { changes: input.items.length },
    });
    return this.getRoleDefaults();
  }
}
