import type { CompanyLogoResponse } from '@neeti-bharat/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

// A change is also written to the activity log.
export const companyLogoApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCompanyLogo: build.query<CompanyLogoResponse, void>({
      query: () => '/company-logo',
      providesTags: ['CompanyLogo'],
    }),
    // A multipart form: the browser sets the content type, with the boundary, itself.
    setCompanyLogo: build.mutation<CompanyLogoResponse, File>({
      query: (file) => {
        const body = new FormData();
        body.append('file', file);
        return { url: '/company-logo', method: 'PUT', body };
      },
      invalidatesTags: [...CHANGES.companyLogo],
    }),
    removeCompanyLogo: build.mutation<void, void>({
      query: () => ({ url: '/company-logo', method: 'DELETE' }),
      invalidatesTags: [...CHANGES.companyLogo],
    }),
  }),
});

export const { useGetCompanyLogoQuery, useSetCompanyLogoMutation, useRemoveCompanyLogoMutation } =
  companyLogoApi;
