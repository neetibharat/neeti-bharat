import type { CreateOrganizationRequest, OrganizationSummary } from '@dpdp-kit/shared';
import { baseApi } from './base-api';

export const organizationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // The caller moves into the new organisation afterwards, which reloads the app, so nothing is invalidated here.
    // Ends the set-up of the organisation being worked in. The caller reloads the app afterwards.
    completeOnboarding: build.mutation<void, void>({
      query: () => ({ url: '/organizations/current/onboarding', method: 'POST' }),
    }),
    createOrganization: build.mutation<OrganizationSummary, CreateOrganizationRequest>({
      query: (body) => ({ url: '/organizations', method: 'POST', body }),
    }),
  }),
});

export const { useCompleteOnboardingMutation, useCreateOrganizationMutation } = organizationsApi;
