import { ORGANIZATION_HEADER, type ApiErrorBody, type ErrorCode } from '@neeti-bharat/shared';
import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { getActiveOrganizationId } from '../active-organization';
import { TAG_TYPES } from './tags';

/** What a failed call looks like to the UI: a code to translate, never prose. */
export interface ApiError {
  status: number | string;
  code: ErrorCode;
  /** The values the message for the code fills in, such as a limit or a reason. */
  params?: ApiErrorBody['params'];
}

// Every call says which organisation it is for, so one person can work in several.
const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/v1',
  credentials: 'same-origin',
  prepareHeaders: (headers) => {
    const organizationId = getActiveOrganizationId();
    if (organizationId) headers.set(ORGANIZATION_HEADER, organizationId);
    return headers;
  },
});

/** Reads the code the API sent, and the values for its message; anything else, such as a network failure or an HTML error page, is INTERNAL. */
export function toApiError(error: FetchBaseQueryError): ApiError {
  const data: unknown = error.data;
  const code = hasCode(data) ? data.code : 'INTERNAL';
  const params = hasCode(data) ? paramsOf(data) : undefined;
  return { status: error.status, code, ...(params && { params }) };
}

/** The values are text and numbers; anything else in their place is left out. */
function paramsOf(data: object): ApiErrorBody['params'] {
  const params = (data as { params?: unknown }).params;
  if (typeof params !== 'object' || params === null) return undefined;
  const values = Object.entries(params).filter(
    (entry): entry is [string, string | number] =>
      typeof entry[1] === 'string' || typeof entry[1] === 'number',
  );
  return values.length ? Object.fromEntries(values) : undefined;
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
