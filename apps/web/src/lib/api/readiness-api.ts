import type {
  ReadinessCheckResponse,
  ReadinessResponse,
  TakeReadinessCheckRequest,
} from '@neeti-bharat/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

// A check is also written to the activity log.
export const readinessApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getReadiness: build.query<ReadinessResponse, void>({
      query: () => '/readiness',
      providesTags: ['Readiness'],
    }),
    takeReadinessCheck: build.mutation<ReadinessCheckResponse, TakeReadinessCheckRequest>({
      query: (body) => ({ url: '/readiness', method: 'POST', body }),
      invalidatesTags: [...CHANGES.readiness],
    }),
  }),
});

export const { useGetReadinessQuery, useTakeReadinessCheckMutation } = readinessApi;
