import type {
  PolicyCheckResponse,
  PolicyTailorResponse,
  ProofCheckResponse,
  TailorPolicyRequest,
} from '@dpdp-kit/shared';
import { baseApi } from './base-api';

export const aiToolsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // These three read and suggest, and save nothing. Each use is written to the activity log, so the log is refreshed.
    // They wait on the AI service, which can take up to a minute.
    tailorPolicy: build.mutation<PolicyTailorResponse, { policyId: string } & TailorPolicyRequest>({
      query: ({ policyId, context }) => ({
        url: `/policies/${encodeURIComponent(policyId)}/tailor`,
        method: 'POST',
        body: { context },
      }),
      invalidatesTags: ['Activity'],
    }),
    checkPolicy: build.mutation<PolicyCheckResponse, string>({
      query: (policyId) => ({
        url: `/policies/${encodeURIComponent(policyId)}/check`,
        method: 'POST',
      }),
      invalidatesTags: ['Activity'],
    }),
    checkProof: build.mutation<ProofCheckResponse, { controlId: string; evidenceId: string }>({
      query: ({ controlId, evidenceId }) => ({
        url: `/controls/${encodeURIComponent(controlId)}/evidence/${encodeURIComponent(evidenceId)}/check`,
        method: 'POST',
      }),
      invalidatesTags: ['Activity'],
    }),
  }),
});

export const { useTailorPolicyMutation, useCheckPolicyMutation, useCheckProofMutation } =
  aiToolsApi;
