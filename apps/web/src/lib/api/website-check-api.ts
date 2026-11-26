import type {
  RunWebsiteCheckRequest,
  WebsiteCheckListResponse,
  WebsiteCheckResponse,
} from '@neeti-bharat/shared';
import { WEBSITE_CHECK_PAGE_SIZE } from '@neeti-bharat/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

// A run is also written to the activity log.
export const websiteCheckApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // One page of past runs, newest first, without their results.
    getWebsiteChecks: build.query<WebsiteCheckListResponse, number>({
      query: (page) => ({
        url: '/website-checks',
        params: { page, limit: WEBSITE_CHECK_PAGE_SIZE },
      }),
      providesTags: ['WebsiteCheck'],
    }),
    getWebsiteCheck: build.query<WebsiteCheckResponse, string>({
      query: (id) => `/website-checks/${encodeURIComponent(id)}`,
      providesTags: ['WebsiteCheck'],
    }),
    // Visits the site, so it can take about ten seconds.
    runWebsiteCheck: build.mutation<WebsiteCheckResponse, RunWebsiteCheckRequest>({
      query: (body) => ({ url: '/website-checks', method: 'POST', body }),
      invalidatesTags: [...CHANGES.websiteCheck],
    }),
  }),
});

export const { useGetWebsiteChecksQuery, useGetWebsiteCheckQuery, useRunWebsiteCheckMutation } =
  websiteCheckApi;
