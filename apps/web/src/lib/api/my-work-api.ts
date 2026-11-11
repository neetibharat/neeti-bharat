import type { MyWorkResponse, MyWorkTeamResponse } from '@dpdp-kit/shared';
import { baseApi } from './base-api';

const WORK_TAGS = ['Proof', 'Evidence', 'Policy', 'Checklist', 'People'] as const;

export const myWorkApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // What is waiting on someone moves with proof, policies, controls and who holds which job.
    // Pass a person to see their work instead (admins only).
    getMyWork: build.query<MyWorkResponse, string | void>({
      query: (personId) => (personId ? `/my-work/of/${encodeURIComponent(personId)}` : '/my-work'),
      providesTags: [...WORK_TAGS],
    }),
    getMyWorkTeam: build.query<MyWorkTeamResponse, void>({
      query: () => '/my-work/team',
      providesTags: [...WORK_TAGS],
    }),
  }),
});

export const { useGetMyWorkQuery, useGetMyWorkTeamQuery } = myWorkApi;
