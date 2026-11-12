/**
 * Stable machine-readable error codes. The API never sends user-facing prose;
 * the web app translates each code through its `errors.<code>` message.
 */
export const ERROR_CODES = [
  'INTERNAL',
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'INVITATION_REQUIRED',
  'CONFIRMATION_REQUIRED',
  'LAST_ADMIN',
  'BUILT_IN',
  'HAS_CONTROLS',
  'STEP_ORDER',
  'BREACH_CLOSED',
  'REQUEST_CLOSED',
  'REQUEST_NOT_READY',
  'IDENTITY_NOT_VERIFIED',
  'FILE_REQUIRED',
  'FILE_TOO_LARGE',
  'FILE_TYPE_NOT_ALLOWED',
  'STORAGE_NOT_CONFIGURED',
  'URL_NOT_ALLOWED',
  'ORGANIZATION_REQUIRED',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ApiErrorBody {
  statusCode: number;
  code: ErrorCode;
  /** Values the translated message may interpolate. */
  params?: Record<string, string | number>;
}
