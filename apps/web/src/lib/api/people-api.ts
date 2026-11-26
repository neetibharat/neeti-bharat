import type {
  AddPersonRequest,
  AssignRoleRequest,
  JobRole,
  LeaveResponse,
  PeopleListResponse,
  PersonOptionsResponse,
  RoleHoldersResponse,
  PersonResponse,
  SetAccessRequest,
  UpdatePersonRequest,
} from '@neeti-bharat/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

export interface PeopleQuery {
  status: 'active' | 'left';
  q?: string;
  page: number;
  limit: number;
}

// Everything here is also written to the activity log, and a DPO change also reaches the company profile.
export const peopleApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // One page of people. The head counts in it do not change with the page or the search.
    getPeople: build.query<PeopleListResponse, PeopleQuery>({
      query: (params) => ({ url: '/people', params }),
      providesTags: ['People'],
    }),
    // Just id and name, for the pickers.
    getPersonOptions: build.query<PersonOptionsResponse, void>({
      query: () => '/people/options',
      providesTags: ['People'],
    }),
    getRoleHolders: build.query<RoleHoldersResponse, void>({
      query: () => '/roles',
      providesTags: ['People'],
    }),
    addPerson: build.mutation<PersonResponse, AddPersonRequest>({
      query: (body) => ({ url: '/people', method: 'POST', body }),
      invalidatesTags: ['People', 'Activity'],
    }),
    updatePerson: build.mutation<PersonResponse, { id: string } & UpdatePersonRequest>({
      query: ({ id, ...body }) => ({ url: `/people/${id}`, method: 'PATCH', body }),
      invalidatesTags: [...CHANGES.person],
    }),
    setAccess: build.mutation<void, { id: string } & SetAccessRequest>({
      query: ({ id, ...body }) => ({ url: `/people/${id}/access`, method: 'PUT', body }),
      invalidatesTags: ['People', 'Activity'],
    }),
    leavePerson: build.mutation<LeaveResponse, string>({
      query: (id) => ({ url: `/people/${id}/leave`, method: 'POST' }),
      // Not refreshed here: the person moves tabs, which would close the result the admin is reading.
      // The dialog refreshes the lists when it is closed.
      invalidatesTags: ['Activity'],
    }),
    resendInvitation: build.mutation<PersonResponse, string>({
      query: (id) => ({ url: `/people/${id}/resend-invitation`, method: 'POST' }),
      invalidatesTags: ['People', 'Activity'],
    }),
    assignRole: build.mutation<void, { role: JobRole } & AssignRoleRequest>({
      query: ({ role, ...body }) => ({ url: `/roles/${role}`, method: 'PUT', body }),
      invalidatesTags: [...CHANGES.person],
    }),
  }),
});

/** One person, for their own page. */
export const personApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPerson: build.query<PersonResponse, string>({
      query: (id) => `/people/${id}`,
      providesTags: ['People'],
    }),
  }),
});

export const {
  useGetPeopleQuery,
  useGetPersonOptionsQuery,
  useGetRoleHoldersQuery,
  useAddPersonMutation,
  useUpdatePersonMutation,
  useSetAccessMutation,
  useLeavePersonMutation,
  useResendInvitationMutation,
  useAssignRoleMutation,
} = peopleApi;

export const { useGetPersonQuery } = personApi;
