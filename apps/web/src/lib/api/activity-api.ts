import type {
  ActivityAction,
  ActivityListResponse,
  ActivityVerifyResponse,
} from '@dpdp-kit/shared';
import { baseApi } from './base-api';

const PAGE_SIZE = 25;

export interface ActivityFilter {
  action?: ActivityAction;
}

export const activityApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Pages of the log, newest first. The cursor from one page asks for the next, older one.
    listActivity: build.infiniteQuery<ActivityListResponse, ActivityFilter, string | undefined>({
      infiniteQueryOptions: {
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },
      query: ({ queryArg, pageParam }) => ({
        url: '/activity',
        params: { limit: PAGE_SIZE, cursor: pageParam, action: queryArg.action },
      }),
      providesTags: ['Activity'],
    }),
    verifyActivity: build.query<ActivityVerifyResponse, void>({
      query: () => '/activity/verify',
      keepUnusedDataFor: 0,
    }),
  }),
});

export const { useListActivityInfiniteQuery, useLazyVerifyActivityQuery } = activityApi;
