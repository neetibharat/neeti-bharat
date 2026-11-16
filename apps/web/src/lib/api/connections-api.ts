import type {
  ConnectionListResponse,
  ConnectionRunListResponse,
  ConnectionRunResponse,
  ConnectionSummary,
  CreateConnectionRequest,
} from '@dpdp-kit/shared';
import { CONNECTION_PAGE_SIZE, CONNECTION_RUN_PAGE_SIZE } from '@dpdp-kit/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

// Adding, removing and checking are also written to the activity log.
export const connectionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getConnections: build.query<ConnectionListResponse, number>({
      query: (page) => ({ url: '/connections', params: { page, limit: CONNECTION_PAGE_SIZE } }),
      providesTags: ['Connection'],
    }),
    // The details are tried against the system first, so this can take a few seconds. The secret is not sent back.
    createConnection: build.mutation<ConnectionSummary, CreateConnectionRequest>({
      query: (body) => ({ url: '/connections', method: 'POST', body }),
      invalidatesTags: [...CHANGES.connection],
    }),
    removeConnection: build.mutation<void, string>({
      query: (id) => ({ url: `/connections/${encodeURIComponent(id)}`, method: 'DELETE' }),
      invalidatesTags: [...CHANGES.connection],
    }),
    // Reads the system, so it can take up to about half a minute.
    runConnection: build.mutation<ConnectionRunResponse, string>({
      query: (id) => ({ url: `/connections/${encodeURIComponent(id)}/run`, method: 'POST' }),
      invalidatesTags: [...CHANGES.connection],
    }),
    getConnectionRuns: build.query<ConnectionRunListResponse, { id: string; page: number }>({
      query: ({ id, page }) => ({
        url: `/connections/${encodeURIComponent(id)}/runs`,
        params: { page, limit: CONNECTION_RUN_PAGE_SIZE },
      }),
      providesTags: ['Connection'],
    }),
    getConnectionRun: build.query<ConnectionRunResponse, string>({
      query: (runId) => `/connections/runs/${encodeURIComponent(runId)}`,
      providesTags: ['Connection'],
    }),
  }),
});

export const {
  useGetConnectionsQuery,
  useCreateConnectionMutation,
  useRemoveConnectionMutation,
  useRunConnectionMutation,
  useGetConnectionRunsQuery,
  useGetConnectionRunQuery,
} = connectionsApi;
