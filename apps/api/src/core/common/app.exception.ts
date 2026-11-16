import { HttpException, HttpStatus } from '@nestjs/common';
import type { ApiErrorBody, ErrorCode } from '@dpdp-kit/shared';

/** Throw this for expected failures; the client translates `code` into prose. */
export class AppException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    status: HttpStatus,
    readonly params?: ApiErrorBody['params'],
  ) {
    super(code, status);
  }
}
