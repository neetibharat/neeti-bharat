import type {
  AddTrainingRequest,
  CompleteTrainingRequest,
  MyTrainingResponse,
  TeamTrainingResponse,
  TrainingListResponse,
  TrainingResponse,
  UpdateTrainingRequest,
} from '@dpdp-kit/shared';
import { baseApi } from './base-api';
import { CHANGES } from './tags';

export interface TeamTrainingQuery {
  q?: string;
  page: number;
  limit: number;
}

// Everything here is also written to the activity log.

/** A change that sends nothing. */
const post = (url: string) => ({ url, method: 'POST' as const });

/** The trainings themselves: what the company asks for. */
export const trainingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTrainings: build.query<TrainingListResponse, void>({
      query: () => '/trainings',
      providesTags: ['Training'],
    }),
    addTraining: build.mutation<TrainingResponse, AddTrainingRequest>({
      query: (body) => ({ url: '/trainings', method: 'POST', body }),
      invalidatesTags: [...CHANGES.training],
    }),
    addSuggestedTrainings: build.mutation<TrainingListResponse, void>({
      query: () => post('/trainings/starters'),
      invalidatesTags: [...CHANGES.training],
    }),
    updateTraining: build.mutation<TrainingResponse, { id: string } & UpdateTrainingRequest>({
      query: ({ id, ...body }) => ({ url: `/trainings/${id}`, method: 'PATCH', body }),
      invalidatesTags: [...CHANGES.training],
    }),
    archiveTraining: build.mutation<TrainingResponse, string>({
      query: (id) => post(`/trainings/${id}/archive`),
      invalidatesTags: [...CHANGES.training],
    }),
    restoreTraining: build.mutation<TrainingResponse, string>({
      query: (id) => post(`/trainings/${id}/restore`),
      invalidatesTags: [...CHANGES.training],
    }),
  }),
});

/** Who has taken what. */
export const completionApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // The trainings in use, with the day the signed-in person took each.
    getMyTraining: build.query<MyTrainingResponse, void>({
      query: () => '/trainings/mine',
      providesTags: ['Training'],
    }),
    completeTraining: build.mutation<MyTrainingResponse, { id: string } & CompleteTrainingRequest>({
      query: ({ id, ...body }) => ({ url: `/trainings/${id}/complete`, method: 'POST', body }),
      invalidatesTags: [...CHANGES.training],
    }),
    reopenTraining: build.mutation<MyTrainingResponse, { id: string; personId?: string }>({
      query: ({ id, ...params }) => ({
        url: `/trainings/${id}/complete`,
        method: 'DELETE',
        params,
      }),
      invalidatesTags: [...CHANGES.training],
    }),
  }),
});

/** How far people have got: one person, or everyone a page at a time. */
export const progressApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // What one person has done, for their own page.
    getPersonTraining: build.query<MyTrainingResponse, string>({
      query: (personId) => `/trainings/of/${personId}`,
      providesTags: ['Training'],
    }),
    // One page of people with how far each has got.
    getTeamTraining: build.query<TeamTrainingResponse, TeamTrainingQuery>({
      query: (params) => ({ url: '/trainings/team', params }),
      providesTags: ['Training'],
    }),
  }),
});

export const {
  useGetTrainingsQuery,
  useAddTrainingMutation,
  useAddSuggestedTrainingsMutation,
  useUpdateTrainingMutation,
  useArchiveTrainingMutation,
  useRestoreTrainingMutation,
} = trainingApi;

export const { useGetMyTrainingQuery, useCompleteTrainingMutation, useReopenTrainingMutation } =
  completionApi;

export const { useGetPersonTrainingQuery, useGetTeamTrainingQuery } = progressApi;
