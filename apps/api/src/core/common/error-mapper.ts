import { HttpException } from '@nestjs/common';
import type { ApiErrorBody, ErrorCode } from '@neeti-bharat/shared';
import { Prisma } from '../../generated/prisma/client';
import { AppException } from './app.exception';

const CODE_BY_STATUS: Record<number, ErrorCode> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  // Multer's size limit reaches us as a 413.
  413: 'FILE_TOO_LARGE',
  415: 'FILE_TYPE_NOT_ALLOWED',
  429: 'RATE_LIMITED',
};

/** Unique violation, foreign-key violation, record not found. */
const STATUS_BY_PRISMA_CODE: Record<string, number> = {
  P2002: 409,
  P2003: 409,
  P2025: 404,
};

function fromStatus(statusCode: number): ApiErrorBody {
  return { statusCode, code: CODE_BY_STATUS[statusCode] ?? 'INTERNAL' };
}

export function toErrorBody(exception: unknown): ApiErrorBody {
  if (exception instanceof AppException) {
    return { statusCode: exception.getStatus(), code: exception.code, params: exception.params };
  }
  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    return fromStatus(STATUS_BY_PRISMA_CODE[exception.code] ?? 500);
  }
  if (exception instanceof HttpException) {
    return fromStatus(exception.getStatus());
  }
  return fromStatus(500);
}
