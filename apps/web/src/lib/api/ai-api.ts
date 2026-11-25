import type {
  AiSettingsResponse,
  PolicyImportResponse,
  SaveAiFeaturesRequest,
  SaveAiSettingsRequest,
} from '@dpdp-kit/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

// Setting up and removing the AI service are also written to the activity log.
export const aiApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAiSettings: build.query<AiSettingsResponse, void>({
      query: () => '/ai',
      providesTags: ['Ai'],
    }),
    // The key is tried with the service first, so this can take a few seconds. It is not sent back.
    saveAiSettings: build.mutation<AiSettingsResponse, SaveAiSettingsRequest>({
      query: (body) => ({ url: '/ai', method: 'PUT', body }),
      invalidatesTags: [...CHANGES.ai],
    }),
    removeAiSettings: build.mutation<void, void>({
      query: () => ({ url: '/ai', method: 'DELETE' }),
      invalidatesTags: [...CHANGES.ai],
    }),
    // Switching features off or on leaves the key and the model alone.
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

export const {
  useGetAiSettingsQuery,
  useSaveAiSettingsMutation,
  useRemoveAiSettingsMutation,
  useImportPolicyMutation,
  useSetAiFeaturesMutation,
} = aiApi;
