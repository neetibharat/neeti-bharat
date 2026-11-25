import type { MyPoliciesResponse, TeamPoliciesResponse } from '@dpdp-kit/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

export interface TeamPoliciesQuery {
  q?: string;
  page: number;
  limit: number;
}

// Accepting is also written to the activity log.
export const policyAcceptanceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // The approved policies, with the day the signed-in person accepted each.
    getMyPolicies: build.query<MyPoliciesResponse, void>({
      query: () => '/policy-acceptance/mine',
      providesTags: ['Acceptance', 'Policy'],
    }),
    // The same for one person, for their own page.
    getPersonPolicies: build.query<MyPoliciesResponse, string>({
      query: (personId) => `/policy-acceptance/of/${personId}`,
      providesTags: ['Acceptance', 'Policy'],
    }),
    // One page of people with how many policies each has accepted.
    getTeamPolicies: build.query<TeamPoliciesResponse, TeamPoliciesQuery>({
      query: (params) => ({ url: '/policy-acceptance/team', params }),
      providesTags: ['Acceptance', 'Policy'],
    }),
    acceptPolicy: build.mutation<MyPoliciesResponse, string>({
      query: (policyId) => ({ url: `/policy-acceptance/${policyId}/accept`, method: 'POST' }),
      invalidatesTags: [...CHANGES.acceptance],
    }),
  }),
});

export const {
  useGetMyPoliciesQuery,
  useGetPersonPoliciesQuery,
  useGetTeamPoliciesQuery,
  useAcceptPolicyMutation,
} = policyAcceptanceApi;
