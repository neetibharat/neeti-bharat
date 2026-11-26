import type { StorageStatusResponse } from '@neeti-bharat/shared';
import { baseApi } from './base-api';

export const storageApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Changes only with the server's settings, so it is read once and kept.
    getStorage: build.query<StorageStatusResponse, void>({ query: () => '/storage' }),
  }),
});

export const { useGetStorageQuery } = storageApi;
