import type {
  PolicyDetailResponse,
  PolicyDocument,
  PolicyVersionResponse,
  SetPolicyApproverRequest,
} from '@dpdp-kit/shared';
import { baseApi } from './base-api';

// Every change is also written to the activity log.
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

export const {
  useSavePolicyContentMutation,
  useSetPolicyApproverMutation,
  useGetPolicyVersionQuery,
} = policyEditApi;
