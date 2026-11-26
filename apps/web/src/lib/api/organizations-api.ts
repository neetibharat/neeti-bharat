import type {
  CloseOrganizationRequest,
  CreateOrganizationRequest,
  OrganizationSummary,
} from '@neeti-bharat/shared';
import { baseApi } from './base-api';

export const organizationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // The caller moves into the new organisation afterwards, which reloads the app, so nothing is invalidated here.
    // Ends the set-up of the organisation being worked in. The caller reloads the app afterwards.
    completeOnboarding: build.mutation<void, void>({
      query: () => ({ url: '/organizations/current/onboarding', method: 'POST' }),
    }),
    // Closes the organisation being worked in. The caller reloads the app, which moves into another one.
    closeOrganization: build.mutation<void, CloseOrganizationRequest>({
      query: (body) => ({ url: '/organizations/current/close', method: 'POST', body }),
    }),
    createOrganization: build.mutation<OrganizationSummary, CreateOrganizationRequest>({
      query: (body) => ({ url: '/organizations', method: 'POST', body }),
    }),
  }),
});

export const {
  useCloseOrganizationMutation,
  useCompleteOnboardingMutation,
  useCreateOrganizationMutation,
} = organizationsApi;
