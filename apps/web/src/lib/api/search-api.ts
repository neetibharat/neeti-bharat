import type { SearchResponse } from '@dpdp-kit/shared';
import { baseApi } from './base-api';

// A search only reads, so it keeps no tag; the cache simply expires.
export const searchApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    search: build.query<SearchResponse, string>({
      query: (q) => ({ url: '/search', params: { q } }),
      keepUnusedDataFor: 30,
    }),
  }),
});

export const { useSearchQuery } = searchApi;
