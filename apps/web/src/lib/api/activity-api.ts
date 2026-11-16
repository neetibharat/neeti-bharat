import type {
  ActivityAction,
  ActivityListResponse,
  ActivityVerifyResponse,
} from '@dpdp-kit/shared';
import { ACTIVITY_PAGE_SIZE } from '@dpdp-kit/shared';
import { baseApi } from './base-api';

export interface ActivityQuery {
  action?: ActivityAction;
  page: number;
  /** Events on the page; the log page uses the default. */
  limit?: number;
}

export const activityApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // One page of the log, newest first. The total lets the page controls work out how many pages there are.
    listActivity: build.query<ActivityListResponse, ActivityQuery>({
      query: ({ action, page, limit }) => ({
        url: '/activity',
        params: { action, page, limit: limit ?? ACTIVITY_PAGE_SIZE },
      }),
      providesTags: ['Activity'],
    }),
    verifyActivity: build.query<ActivityVerifyResponse, void>({
      query: () => '/activity/verify',
      keepUnusedDataFor: 0,
    }),
  }),
});

export const { useListActivityQuery, useLazyVerifyActivityQuery } = activityApi;
