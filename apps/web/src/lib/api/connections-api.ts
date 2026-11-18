import type {
  ConnectionListResponse,
  ConnectionRunListResponse,
  ConnectionRunResponse,
  ConnectionSummary,
  CreateConnectionRequest,
  DiscoverGithubRequest,
  DiscoverGithubResponse,
  FindSubscriptionsRequest,
  FindSubscriptionsResponse,
  GithubRepositoriesResponse,
  UpdateConnectionRequest,
} from '@dpdp-kit/shared';
import { CONNECTION_PAGE_SIZE, CONNECTION_RUN_PAGE_SIZE } from '@dpdp-kit/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

// Adding, changing, removing and checking are also written to the activity log.
export const connectionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // `limit` is for a picker that needs every connection; a list pages by the default.
    getConnections: build.query<ConnectionListResponse, { page: number; limit?: number }>({
      query: ({ page, limit = CONNECTION_PAGE_SIZE }) => ({
        url: '/connections',
        params: { page, limit },
      }),
      providesTags: ['Connection'],
    }),
    // The details are tried against the system first, so this can take a few seconds. The secret is not sent back.
    createConnection: build.mutation<ConnectionSummary, CreateConnectionRequest>({
      query: (body) => ({ url: '/connections', method: 'POST', body }),
      invalidatesTags: [...CHANGES.connection],
    }),
    // New details are tried first too. Only what is sent changes.
    updateConnection: build.mutation<ConnectionSummary, { id: string } & UpdateConnectionRequest>({
      query: ({ id, ...body }) => ({
        url: `/connections/${encodeURIComponent(id)}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [...CHANGES.connection],
    }),
    removeConnection: build.mutation<void, string>({
      query: (id) => ({ url: `/connections/${encodeURIComponent(id)}`, method: 'DELETE' }),
      invalidatesTags: [...CHANGES.connection],
    }),
  }),
});

// What a system can see, for the person to choose from. None of it is saved.
export const lookupApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    findSubscriptions: build.mutation<FindSubscriptionsResponse, FindSubscriptionsRequest>({
      query: (body) => ({ url: '/connections/subscriptions', method: 'POST', body }),
    }),
    discoverGithub: build.mutation<DiscoverGithubResponse, DiscoverGithubRequest>({
      query: (body) => ({ url: '/connections/github/discover', method: 'POST', body }),
    }),
    // From the connection's own stored key, to change which repositories it reads.
    getGithubRepositories: build.query<GithubRepositoriesResponse, string>({
      query: (id) => `/connections/${encodeURIComponent(id)}/repositories`,
      providesTags: ['Connection'],
    }),
  }),
});

export const runsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
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
  useUpdateConnectionMutation,
  useRemoveConnectionMutation,
} = connectionsApi;

export const {
  useFindSubscriptionsMutation,
  useDiscoverGithubMutation,
  useGetGithubRepositoriesQuery,
} = lookupApi;

export const { useRunConnectionMutation, useGetConnectionRunsQuery, useGetConnectionRunQuery } =
  runsApi;
