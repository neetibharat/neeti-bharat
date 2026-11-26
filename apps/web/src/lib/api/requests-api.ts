import type {
  AddRequestTaskRequest,
  CloseRequestRequest,
  CreateRequestRequest,
  RequestAttentionResponse,
  RequestBoardResponse,
  RequestListResponse,
  RequestResponse,
  RequestTab,
  RequestType,
  UpdateRequestRequest,
  UpdateRequestTaskRequest,
  VerifyIdentityRequest,
} from '@neeti-bharat/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

export interface RequestQuery {
  tab: RequestTab;
  type?: RequestType;
  q?: string;
  page?: number;
  limit?: number;
}

export interface RequestBoardQuery {
  type?: RequestType;
  q?: string;
  limit?: number;
}

const path = (id: string) => `/requests/${encodeURIComponent(id)}`;

// Everything here is also written to the activity log, and moves My work and the Dashboard.
export const requestsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // One page of the list. The counts in it do not change with the tab, the page, the type or the search.
    getRequests: build.query<RequestListResponse, RequestQuery>({
      query: (params) => ({ url: '/requests', params }),
      providesTags: ['Request'],
    }),
    // The latest few cards of each column of the board, with the same counts as the list.
    getRequestsBoard: build.query<RequestBoardResponse, RequestBoardQuery>({
      query: (params) => ({ url: '/requests/board', params }),
      providesTags: ['Request'],
    }),
    // The open requests that are late or due within a week, for the Dashboard.
    getRequestAttention: build.query<RequestAttentionResponse, void>({
      query: () => '/requests/attention',
      providesTags: ['Request'],
    }),
    getRequest: build.query<RequestResponse, string>({
      query: path,
      providesTags: ['Request'],
    }),
    createRequest: build.mutation<RequestResponse, CreateRequestRequest>({
      query: (body) => ({ url: '/requests', method: 'POST', body }),
      invalidatesTags: [...CHANGES.request],
    }),
    updateRequest: build.mutation<RequestResponse, { id: string } & UpdateRequestRequest>({
      query: ({ id, ...body }) => ({ url: path(id), method: 'PUT', body }),
      invalidatesTags: [...CHANGES.request],
    }),
  }),
});

// The work on one request: the identity check, the tasks and the close.
export const requestWorkApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    verifyIdentity: build.mutation<RequestResponse, { id: string } & VerifyIdentityRequest>({
      query: ({ id, ...body }) => ({ url: `${path(id)}/identity`, method: 'POST', body }),
      invalidatesTags: [...CHANGES.request],
    }),
    addRequestTask: build.mutation<RequestResponse, { id: string } & AddRequestTaskRequest>({
      query: ({ id, ...body }) => ({ url: `${path(id)}/tasks`, method: 'POST', body }),
      invalidatesTags: [...CHANGES.request],
    }),
    updateRequestTask: build.mutation<
      RequestResponse,
      { id: string; taskId: string } & UpdateRequestTaskRequest
    >({
      query: ({ id, taskId, ...body }) => ({
        url: `${path(id)}/tasks/${encodeURIComponent(taskId)}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [...CHANGES.request],
    }),
    removeRequestTask: build.mutation<RequestResponse, { id: string; taskId: string }>({
      query: ({ id, taskId }) => ({
        url: `${path(id)}/tasks/${encodeURIComponent(taskId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: [...CHANGES.request],
    }),
    closeRequest: build.mutation<RequestResponse, { id: string } & CloseRequestRequest>({
      query: ({ id, ...body }) => ({ url: `${path(id)}/close`, method: 'POST', body }),
      invalidatesTags: [...CHANGES.request],
    }),
  }),
});

export const {
  useGetRequestsQuery,
  useLazyGetRequestsQuery,
  useGetRequestsBoardQuery,
  useGetRequestAttentionQuery,
  useGetRequestQuery,
  useCreateRequestMutation,
  useUpdateRequestMutation,
} = requestsApi;

export const {
  useVerifyIdentityMutation,
  useAddRequestTaskMutation,
  useUpdateRequestTaskMutation,
  useRemoveRequestTaskMutation,
  useCloseRequestMutation,
} = requestWorkApi;
