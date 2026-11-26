import type {
  AiSettingsResponse,
  PolicyImportResponse,
  SaveAiFeaturesRequest,
} from '@neeti-bharat/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

// Choosing which features are on is also written to the activity log. The service itself is set in the install's environment.
export const aiApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAiSettings: build.query<AiSettingsResponse, void>({
      query: () => '/ai',
      providesTags: ['Ai'],
    }),
    // Which features are on.
    setAiFeatures: build.mutation<AiSettingsResponse, SaveAiFeaturesRequest>({
      query: (body) => ({ url: '/ai/features', method: 'PUT', body }),
      invalidatesTags: [...CHANGES.ai],
    }),
    // A multipart form: the browser sets the content type, with the boundary, itself. Nothing is saved by this: the
    // reply fills the Add policy form, and the policy is added when the person says so. Reading takes up to a minute.
    importPolicy: build.mutation<PolicyImportResponse, File>({
      query: (file) => {
        const body = new FormData();
        body.append('file', file);
        return { url: '/policies/import', method: 'POST', body };
      },
    }),
  }),
});

export const { useGetAiSettingsQuery, useImportPolicyMutation, useSetAiFeaturesMutation } = aiApi;
