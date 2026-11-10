import { HttpStatus, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { Prisma } from '../../generated/prisma/client';
import { AppException } from './app.exception';
import { toErrorBody } from './error-mapper';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('boom', { code, clientVersion: 'test' });

describe('toErrorBody', () => {
  it('passes through AppException code and params', () => {
    const body = toErrorBody(new AppException('CONFLICT', HttpStatus.CONFLICT, { field: 'email' }));
    expect(body).toEqual({ statusCode: 409, code: 'CONFLICT', params: { field: 'email' } });
  });

  it('maps Prisma unique violations to 409', () => {
    expect(toErrorBody(prismaError('P2002'))).toEqual({ statusCode: 409, code: 'CONFLICT' });
  });

  it('maps Prisma missing records to 404', () => {
    expect(toErrorBody(prismaError('P2025'))).toEqual({ statusCode: 404, code: 'NOT_FOUND' });
  });

  it('maps Nest HTTP exceptions by status', () => {
    expect(toErrorBody(new NotFoundException())).toEqual({ statusCode: 404, code: 'NOT_FOUND' });
  });

  it('hides unknown errors behind INTERNAL', () => {
    expect(toErrorBody(new Error('secret detail'))).toEqual({ statusCode: 500, code: 'INTERNAL' });
  });
});
