import type {
  AddProfileEntryRequest,
  ProfileEntryResponse,
  ProfileResponse,
  UpdateProfileEntryRequest,
} from '@neeti-bharat/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

// Every change is also written to the activity log, so the log is refreshed too.
export const profileApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProfile: build.query<ProfileResponse, void>({
      query: () => '/profile',
      providesTags: ['Profile'],
    }),
    updateProfileEntry: build.mutation<
      ProfileEntryResponse,
      { key: string } & UpdateProfileEntryRequest
    >({
      query: ({ key, ...body }) => ({
        url: `/profile/entries/${encodeURIComponent(key)}`,
        method: 'PUT',
        body,
      }),
      // The set-up answers decide which DPDP rules apply, so the checklist is refreshed too.
      invalidatesTags: [...CHANGES.profile],
    }),
    addProfileEntry: build.mutation<ProfileEntryResponse, AddProfileEntryRequest>({
      query: (body) => ({ url: '/profile/entries', method: 'POST', body }),
      invalidatesTags: [...CHANGES.profile],
    }),
    removeProfileEntry: build.mutation<void, string>({
      query: (key) => ({
        url: `/profile/entries/${encodeURIComponent(key)}`,
        method: 'DELETE',
      }),
      invalidatesTags: [...CHANGES.profile],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileEntryMutation,
  useAddProfileEntryMutation,
  useRemoveProfileEntryMutation,
} = profileApi;
