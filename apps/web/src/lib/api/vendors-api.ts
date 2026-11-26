import type {
  ActivityListResponse,
  AddVendorRequest,
  UpdateVendorRequest,
  VendorListResponse,
  VendorResponse,
  VendorTab,
} from '@neeti-bharat/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

export interface VendorsQuery {
  tab: VendorTab;
  q?: string;
  page: number;
  limit: number;
}

// Everything here is also written to the activity log.
export const vendorsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // One page of vendors in a tab. The head counts in it do not change with the page or the search.
    getVendors: build.query<VendorListResponse, VendorsQuery>({
      query: (params) => ({ url: '/vendors', params }),
      providesTags: ['Vendor'],
    }),
    getVendor: build.query<VendorResponse, string>({
      query: (id) => `/vendors/${id}`,
      providesTags: ['Vendor'],
    }),
    // What has been done to one vendor. A change to the vendor adds to it, so it follows the vendor and the log.
    getVendorActivity: build.query<
      ActivityListResponse,
      { id: string; page: number; limit: number }
    >({
      query: ({ id, ...params }) => ({ url: `/vendors/${id}/activity`, params }),
      providesTags: ['Vendor', 'Activity'],
    }),
    addVendor: build.mutation<VendorResponse, AddVendorRequest>({
      query: (body) => ({ url: '/vendors', method: 'POST', body }),
      invalidatesTags: [...CHANGES.vendor],
    }),
    updateVendor: build.mutation<VendorResponse, { id: string } & UpdateVendorRequest>({
      query: ({ id, ...body }) => ({ url: `/vendors/${id}`, method: 'PATCH', body }),
      invalidatesTags: [...CHANGES.vendor],
    }),
    archiveVendor: build.mutation<VendorResponse, string>({
      query: (id) => ({ url: `/vendors/${id}/archive`, method: 'POST' }),
      invalidatesTags: [...CHANGES.vendor],
    }),
    restoreVendor: build.mutation<VendorResponse, string>({
      query: (id) => ({ url: `/vendors/${id}/restore`, method: 'POST' }),
      invalidatesTags: [...CHANGES.vendor],
    }),
  }),
});

export const {
  useGetVendorsQuery,
  useGetVendorQuery,
  useGetVendorActivityQuery,
  useAddVendorMutation,
  useUpdateVendorMutation,
  useArchiveVendorMutation,
  useRestoreVendorMutation,
} = vendorsApi;
