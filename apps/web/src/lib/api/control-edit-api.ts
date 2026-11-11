import type {
  AssigneesResponse,
  ControlResponse,
  CreateControlRequest,
  SaveControlRequest,
} from '@dpdp-kit/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

// Every change is also written to the activity log, and a control's policies show on the policy pages.

export const controlEditApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAssignees: build.query<AssigneesResponse, void>({
      query: () => '/assignees',
      providesTags: ['People'],
    }),
    createControl: build.mutation<ControlResponse, CreateControlRequest>({
      query: (body) => ({ url: '/controls', method: 'POST', body }),
      invalidatesTags: [...CHANGES.control],
    }),
    saveControl: build.mutation<ControlResponse, { id: string } & SaveControlRequest>({
      query: ({ id, ...body }) => ({
        url: `/controls/${id}/details`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [...CHANGES.control],
    }),
    archiveControl: build.mutation<void, string>({
      query: (id) => ({ url: `/controls/${id}/archive`, method: 'POST' }),
      invalidatesTags: [...CHANGES.control],
    }),
    restoreControl: build.mutation<void, string>({
      query: (id) => ({ url: `/controls/${id}/restore`, method: 'POST' }),
      invalidatesTags: [...CHANGES.control],
    }),
  }),
});

export const {
  useGetAssigneesQuery,
  useCreateControlMutation,
  useSaveControlMutation,
  useArchiveControlMutation,
  useRestoreControlMutation,
} = controlEditApi;
