import type { ApiErrorBody, ErrorCode } from '@dpdp-kit/shared';
import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { TAG_TYPES } from './tags';

/** What a failed call looks like to the UI: a code to translate, never prose. */
export interface ApiError {
  status: number | string;
  code: ErrorCode;
}

const rawBaseQuery = fetchBaseQuery({ baseUrl: '/v1', credentials: 'same-origin' });

/** Reads the code the API sent; anything else, such as a network failure or an HTML error page, is INTERNAL. */
export function toApiError(error: FetchBaseQueryError): ApiError {
  const data: unknown = error.data;
  const code = hasCode(data) ? data.code : 'INTERNAL';
  return { status: error.status, code };
}

function hasCode(data: unknown): data is Pick<ApiErrorBody, 'code'> {
  return (
    typeof data === 'object' && data !== null && 'code' in data && typeof data.code === 'string'
  );
}

/** Whether a thrown value already has the shape of an `ApiError`. */
export function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, ApiError> = async (args, api, extra) => {
  const result = await rawBaseQuery(args, api, extra);
  return result.error ? { error: toApiError(result.error), meta: result.meta } : result;
};

/** Every feature adds its endpoints to this one API with `injectEndpoints`. */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [...TAG_TYPES],
  endpoints: () => ({}),
});
