import type {
  AddEvidenceRequest,
  EvidenceDownloadResponse,
  EvidenceListResponse,
  EvidenceResponse,
  ProofByControlResponse,
  ProofOverviewResponse,
  ProofRequirementDetailResponse,
  SaveProofRequirementRequest,
} from '@neeti-bharat/shared';
import type { ProofQuery } from '../proof-query';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

// Changes are also written to the activity log, and move a control's status and the Proof page.

export const evidenceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEvidence: build.query<EvidenceListResponse, string>({
      query: (controlId) => `/controls/${controlId}/evidence`,
      providesTags: ['Evidence'],
    }),
    // One page of the list, with the counts for each tab. The search and filters are applied by the server.
    getProofOverview: build.query<ProofOverviewResponse, ProofQuery>({
      query: (params) => ({ url: '/proof', params }),
      providesTags: ['Proof'],
    }),
    // One page of controls, each with its requirements, and the counts for each tab.
    getProofByControl: build.query<ProofByControlResponse, ProofQuery>({
      query: (params) => ({ url: '/proof/by-control', params }),
      providesTags: ['Proof'],
    }),
    getRequirement: build.query<ProofRequirementDetailResponse, string>({
      query: (id) => `/proof/${id}`,
      providesTags: ['Proof', 'Evidence'],
    }),
    addEvidence: build.mutation<EvidenceResponse, { controlId: string } & AddEvidenceRequest>({
      query: ({ controlId, ...body }) => ({
        url: `/controls/${controlId}/evidence`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [...CHANGES.proof],
    }),
    removeEvidence: build.mutation<void, { controlId: string; evidenceId: string }>({
      query: ({ controlId, evidenceId }) => ({
        url: `/controls/${controlId}/evidence/${evidenceId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [...CHANGES.proof],
    }),
  }),
});

export const evidenceFileApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // A multipart form: the browser sets the content type, with the boundary, itself.
    addEvidenceFile: build.mutation<
      EvidenceResponse,
      { controlId: string; file: File; proofRequirementId?: string }
    >({
      query: ({ controlId, file, proofRequirementId }) => {
        const body = new FormData();
        body.append('file', file);
        if (proofRequirementId) body.append('proofRequirementId', proofRequirementId);
        return { url: `/controls/${controlId}/evidence/files`, method: 'POST', body };
      },
      invalidatesTags: [...CHANGES.proof],
    }),
    // A mutation only so that a link is never cached: each one is made when asked for and expires in minutes.
    downloadEvidence: build.mutation<
      EvidenceDownloadResponse,
      { controlId: string; evidenceId: string }
    >({
      query: ({ controlId, evidenceId }) =>
        `/controls/${controlId}/evidence/${evidenceId}/download`,
    }),
  }),
});

export const requirementApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createRequirement: build.mutation<void, { controlId: string } & SaveProofRequirementRequest>({
      query: ({ controlId, ...body }) => ({
        url: `/controls/${controlId}/proof-requirements`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [...CHANGES.proof],
    }),
    saveRequirement: build.mutation<void, { id: string } & SaveProofRequirementRequest>({
      query: ({ id, ...body }) => ({
        url: `/proof-requirements/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [...CHANGES.proof],
    }),
    restoreRequirement: build.mutation<void, string>({
      query: (id) => ({ url: `/proof-requirements/${id}/restore`, method: 'POST' }),
      invalidatesTags: [...CHANGES.proof],
    }),
    archiveRequirement: build.mutation<void, string>({
      query: (id) => ({ url: `/proof-requirements/${id}`, method: 'DELETE' }),
      invalidatesTags: [...CHANGES.proof],
    }),
  }),
});

export const {
  useGetEvidenceQuery,
  useGetProofOverviewQuery,
  useGetProofByControlQuery,
  useGetRequirementQuery,
  useAddEvidenceMutation,
  useRemoveEvidenceMutation,
} = evidenceApi;

export const { useAddEvidenceFileMutation, useDownloadEvidenceMutation } = evidenceFileApi;

export const {
  useCreateRequirementMutation,
  useSaveRequirementMutation,
  useArchiveRequirementMutation,
  useRestoreRequirementMutation,
} = requirementApi;
