import type {
  PolicyCoverageResponse,
  SaveFrameworkRequest,
  SaveRequirementRequest,
} from '@neeti-bharat/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

// A change is also written to the activity log, and moves the list of frameworks and each checklist.

export const frameworkEditApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPolicyCoverage: build.query<PolicyCoverageResponse, string>({
      query: (policyId) => `/policies/${policyId}/coverage`,
      providesTags: ['Checklist', 'Policy'],
    }),
    createFramework: build.mutation<{ id: string }, SaveFrameworkRequest>({
      query: (body) => ({ url: '/frameworks', method: 'POST', body }),
      invalidatesTags: [...CHANGES.rule],
    }),
    updateFramework: build.mutation<void, { id: string } & SaveFrameworkRequest>({
      query: ({ id, ...body }) => ({
        url: `/frameworks/${encodeURIComponent(id)}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [...CHANGES.rule],
    }),
    archiveFramework: build.mutation<void, string>({
      query: (id) => ({
        url: `/frameworks/${encodeURIComponent(id)}/archive`,
        method: 'POST',
      }),
      invalidatesTags: [...CHANGES.rule],
    }),
  }),
});

export const ruleEditApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createRule: build.mutation<{ id: string }, { frameworkId: string } & SaveRequirementRequest>({
      query: ({ frameworkId, ...body }) => ({
        url: `/frameworks/${encodeURIComponent(frameworkId)}/requirements`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [...CHANGES.rule],
    }),
    updateRule: build.mutation<void, { id: string } & SaveRequirementRequest>({
      query: ({ id, ...body }) => ({
        url: `/requirements/${encodeURIComponent(id)}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [...CHANGES.rule],
    }),
    archiveRule: build.mutation<void, string>({
      query: (id) => ({
        url: `/requirements/${encodeURIComponent(id)}/archive`,
        method: 'POST',
      }),
      invalidatesTags: [...CHANGES.rule],
    }),
  }),
});

export const {
  useGetPolicyCoverageQuery,
  useCreateFrameworkMutation,
  useUpdateFrameworkMutation,
  useArchiveFrameworkMutation,
} = frameworkEditApi;

export const { useCreateRuleMutation, useUpdateRuleMutation, useArchiveRuleMutation } = ruleEditApi;
