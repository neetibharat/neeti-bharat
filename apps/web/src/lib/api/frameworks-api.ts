import type {
  ChangePolicyStatusRequest,
  ChecklistResponse,
  FrameworkListResponse,
  PolicyDetailResponse,
  PolicyListResponse,
  RulePageResponse,
} from '@dpdp-kit/shared';
import { baseApi } from './base-api';

// A change is also written to the activity log.
export const frameworksApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getFrameworks: build.query<FrameworkListResponse, void>({
      query: () => '/frameworks',
      providesTags: ['Checklist'],
    }),
    getChecklist: build.query<ChecklistResponse, string>({
      query: (frameworkId) => `/frameworks/${encodeURIComponent(frameworkId)}`,
      providesTags: ['Checklist'],
    }),
    // A rule shows its controls (Checklist) and the policies behind them (Policy).
    getRulePage: build.query<RulePageResponse, { frameworkId: string; ruleId: string }>({
      query: ({ frameworkId, ruleId }) =>
        `/frameworks/${encodeURIComponent(frameworkId)}/rules/${encodeURIComponent(ruleId)}`,
      providesTags: ['Checklist', 'Policy'],
    }),
    getPolicies: build.query<PolicyListResponse, void>({
      query: () => '/policies',
      providesTags: ['Policy'],
    }),
    getPolicy: build.query<PolicyDetailResponse, string>({
      query: (policyId) => `/policies/${policyId}`,
      providesTags: ['Policy'],
    }),
    changePolicyStatus: build.mutation<
      PolicyDetailResponse,
      { policyId: string } & ChangePolicyStatusRequest
    >({
      query: ({ policyId, ...body }) => ({
        url: `/policies/${policyId}/status`,
        method: 'PUT',
        body,
      }),
      // Approving a policy moves the status of every control it covers.
      invalidatesTags: ['Policy', 'Checklist', 'Activity'],
    }),
  }),
});

export const {
  useGetFrameworksQuery,
  useGetChecklistQuery,
  useGetRulePageQuery,
  useGetPoliciesQuery,
  useGetPolicyQuery,
  useChangePolicyStatusMutation,
} = frameworksApi;
