import type {
  ApiKeyListResponse,
  CreateApiKeyRequest,
  CreatedApiKeyResponse,
} from '@neeti-bharat/shared';
import { API_KEY_PAGE_SIZE } from '@neeti-bharat/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

// Making and revoking a key is also written to the activity log.
export const apiKeysApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getApiKeys: build.query<ApiKeyListResponse, number>({
      query: (page) => ({ url: '/api-keys', params: { page, limit: API_KEY_PAGE_SIZE } }),
      providesTags: ['ApiKey'],
    }),
    // The answer holds the whole key. It is shown once and is not kept in the cache longer than the dialog needs.
    createApiKey: build.mutation<CreatedApiKeyResponse, CreateApiKeyRequest>({
      query: (body) => ({ url: '/api-keys', method: 'POST', body }),
      invalidatesTags: [...CHANGES.apiKey],
    }),
    revokeApiKey: build.mutation<void, string>({
      query: (id) => ({ url: `/api-keys/${encodeURIComponent(id)}`, method: 'DELETE' }),
      invalidatesTags: [...CHANGES.apiKey],
    }),
  }),
});

export const { useGetApiKeysQuery, useCreateApiKeyMutation, useRevokeApiKeyMutation } = apiKeysApi;
