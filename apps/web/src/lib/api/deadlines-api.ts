import type { DeadlineTab, DeadlinesResponse } from '@dpdp-kit/shared';
import { baseApi } from './base-api';

export interface DeadlinesQuery {
  tab: DeadlineTab;
  page: number;
  limit: number;
}

// Dates come from breaches, requests, proof, vendors, training and policies, so a change to any of them makes this stale.
export const deadlinesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDeadlines: build.query<DeadlinesResponse, DeadlinesQuery>({
      query: (params) => ({ url: '/deadlines', params }),
      providesTags: ['Breach', 'Request', 'Proof', 'Evidence', 'Vendor', 'Training', 'Policy'],
    }),
  }),
});

export const { useGetDeadlinesQuery } = deadlinesApi;
