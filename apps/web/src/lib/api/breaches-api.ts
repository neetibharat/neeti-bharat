import type {
  BreachListResponse,
  BreachResponse,
  BreachStep,
  BreachTab,
  CompleteBreachStepRequest,
  CreateBreachRequest,
  UpdateBreachRequest,
} from '@dpdp-kit/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

export interface BreachQuery {
  tab: BreachTab;
  q?: string;
  page?: number;
  limit?: number;
}

/** How many open breaches the Dashboard lists. The counts in the answer cover all of them. */
export const DASHBOARD_BREACHES: BreachQuery = { tab: 'open', limit: 5 };

// Everything here is also written to the activity log, and moves My work and the Dashboard.
export const breachesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // One page of the list. The counts in it do not change with the tab, the page or the search.
    getBreaches: build.query<BreachListResponse, BreachQuery>({
      query: (params) => ({ url: '/breaches', params }),
      providesTags: ['Breach'],
    }),
    getBreach: build.query<BreachResponse, string>({
      query: (id) => `/breaches/${encodeURIComponent(id)}`,
      providesTags: ['Breach'],
    }),
    createBreach: build.mutation<BreachResponse, CreateBreachRequest>({
      query: (body) => ({ url: '/breaches', method: 'POST', body }),
      invalidatesTags: [...CHANGES.breach],
    }),
    updateBreach: build.mutation<BreachResponse, { id: string } & UpdateBreachRequest>({
      query: ({ id, ...body }) => ({
        url: `/breaches/${encodeURIComponent(id)}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [...CHANGES.breach],
    }),
    completeBreachStep: build.mutation<
      BreachResponse,
      { id: string; step: BreachStep } & CompleteBreachStepRequest
    >({
      query: ({ id, step, ...body }) => ({
        url: `/breaches/${encodeURIComponent(id)}/steps/${step}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [...CHANGES.breach],
    }),
  }),
});

export const {
  useGetBreachesQuery,
  useGetBreachQuery,
  useCreateBreachMutation,
  useUpdateBreachMutation,
  useCompleteBreachStepMutation,
} = breachesApi;
