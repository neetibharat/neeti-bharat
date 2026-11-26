import type {
  CreatePolicyRequest,
  PolicyDetailResponse,
  PolicyDocument,
  PolicyListResponse,
  PolicyVersionResponse,
  SavePolicyRequest,
  SetPolicyApproverRequest,
} from '@neeti-bharat/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

// Every change is also written to the activity log.
// A policy's name, owner and whether it exists show on the checklist and in My work as well as on its own pages.
export const policyEditApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    savePolicyContent: build.mutation<
      PolicyDetailResponse,
      { policyId: string; content: PolicyDocument }
    >({
      query: ({ policyId, content }) => ({
        url: `/policies/${policyId}/content`,
        method: 'PUT',
        body: { content },
      }),
      invalidatesTags: ['Policy', 'Activity'],
    }),
    setPolicyApprover: build.mutation<
      PolicyDetailResponse,
      { policyId: string } & SetPolicyApproverRequest
    >({
      query: ({ policyId, ...body }) => ({
        url: `/policies/${policyId}/approver`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Policy', 'Activity'],
    }),
    getPolicyVersion: build.query<PolicyVersionResponse, { policyId: string; version: number }>({
      query: ({ policyId, version }) => `/policies/${policyId}/versions/${version}`,
      providesTags: ['Profile'],
    }),
  }),
});

// Adding, editing and archiving a policy. Its title, owner and whether it exists show on the checklist and in
// My work as well as on its own pages.
export const policyManageApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getArchivedPolicies: build.query<PolicyListResponse, void>({
      query: () => '/policies/archived',
      providesTags: ['Policy'],
    }),
    createPolicy: build.mutation<PolicyDetailResponse, CreatePolicyRequest>({
      query: (body) => ({ url: '/policies', method: 'POST', body }),
      invalidatesTags: [...CHANGES.control],
    }),
    savePolicyDetails: build.mutation<
      PolicyDetailResponse,
      { policyId: string } & SavePolicyRequest
    >({
      query: ({ policyId, ...body }) => ({
        url: `/policies/${policyId}/details`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [...CHANGES.control],
    }),
    archivePolicy: build.mutation<void, string>({
      query: (policyId) => ({ url: `/policies/${policyId}/archive`, method: 'POST' }),
      invalidatesTags: [...CHANGES.control],
    }),
    restorePolicy: build.mutation<void, string>({
      query: (policyId) => ({ url: `/policies/${policyId}/restore`, method: 'POST' }),
      invalidatesTags: [...CHANGES.control],
    }),
  }),
});

export const {
  useSavePolicyContentMutation,
  useSetPolicyApproverMutation,
  useGetPolicyVersionQuery,
} = policyEditApi;

export const {
  useGetArchivedPoliciesQuery,
  useCreatePolicyMutation,
  useSavePolicyDetailsMutation,
  useArchivePolicyMutation,
  useRestorePolicyMutation,
} = policyManageApi;
