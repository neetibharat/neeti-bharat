import type {
  NotificationListResponse,
  NotificationPreferencesResponse,
  NotificationRoleDefaultsResponse,
  NotificationUnreadResponse,
  UpdateNotificationPreferencesRequest,
  UpdateNotificationRoleDefaultsRequest,
} from '@dpdp-kit/shared';
import { NOTIFICATION_PAGE_SIZE } from '@dpdp-kit/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

// Reading and choosing are a person's own business, so none of it is written to the activity log.
// An admin changing what a role gets is the company's, and is.
export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query<NotificationListResponse, number>({
      query: (page) => ({ url: '/notifications', params: { page, limit: NOTIFICATION_PAGE_SIZE } }),
      providesTags: ['Notification'],
    }),
    // Polled by the bell, so it is a count and nothing more.
    getUnreadCount: build.query<NotificationUnreadResponse, void>({
      query: () => '/notifications/unread-count',
      providesTags: ['Notification'],
    }),
    markNotificationRead: build.mutation<void, string>({
      query: (id) => ({ url: `/notifications/${encodeURIComponent(id)}/read`, method: 'POST' }),
      invalidatesTags: [...CHANGES.notification],
    }),
    markAllNotificationsRead: build.mutation<void, void>({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      invalidatesTags: [...CHANGES.notification],
    }),
    getNotificationPreferences: build.query<NotificationPreferencesResponse, void>({
      query: () => '/notifications/preferences',
      providesTags: ['NotificationPreference'],
    }),
    updateNotificationPreferences: build.mutation<
      NotificationPreferencesResponse,
      UpdateNotificationPreferencesRequest
    >({
      query: (body) => ({ url: '/notifications/preferences', method: 'PUT', body }),
      invalidatesTags: ['NotificationPreference'],
    }),
    getNotificationRoleDefaults: build.query<NotificationRoleDefaultsResponse, void>({
      query: () => '/notifications/role-defaults',
      providesTags: ['NotificationRoleDefault'],
    }),
    updateNotificationRoleDefaults: build.mutation<
      NotificationRoleDefaultsResponse,
      UpdateNotificationRoleDefaultsRequest
    >({
      query: (body) => ({ url: '/notifications/role-defaults', method: 'PUT', body }),
      invalidatesTags: ['NotificationRoleDefault', 'NotificationPreference', 'Activity'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  useGetNotificationRoleDefaultsQuery,
  useUpdateNotificationRoleDefaultsMutation,
} = notificationsApi;
