import { Reflector } from '@nestjs/core';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import {
  BodyFirstTransactionInterceptor,
  TransactionAfterBody,
  TransactionInterceptor,
} from './transaction.interceptor';
import type { PrismaService } from './prisma.service';

class Routes {
  @TransactionAfterBody()
  upload() {}

  plain() {}
}

const context = (method: string, handler: () => void): ExecutionContext =>
  ({
    getHandler: () => handler,
    switchToHttp: () => ({ getRequest: () => ({ method }) }),
  }) as unknown as ExecutionContext;

function setup() {
  const runInTransaction = vi.fn(async <T>(work: () => Promise<T>) => work());
  const prisma = { runInTransaction } as unknown as PrismaService;
  const next: CallHandler = { handle: () => of('done') };
  return { prisma, runInTransaction, next };
}

describe('TransactionInterceptor', () => {
  it('wraps a request that changes something in a transaction', async () => {
    const { prisma, runInTransaction, next } = setup();
    const interceptor = new TransactionInterceptor(prisma, new Reflector());
    const result = await lastValueFrom(
      interceptor.intercept(context('POST', Routes.prototype.plain), next),
    );
    expect(result).toBe('done');
    expect(runInTransaction).toHaveBeenCalledOnce();
  });

  it('leaves reads alone', async () => {
    const { prisma, runInTransaction, next } = setup();
    const interceptor = new TransactionInterceptor(prisma, new Reflector());
    await lastValueFrom(interceptor.intercept(context('GET', Routes.prototype.plain), next));
    expect(runInTransaction).not.toHaveBeenCalled();
  });

  it('skips a route that starts its own transaction after reading the body', async () => {
    const { prisma, runInTransaction, next } = setup();
    const interceptor = new TransactionInterceptor(prisma, new Reflector());
    await lastValueFrom(interceptor.intercept(context('POST', Routes.prototype.upload), next));
    expect(runInTransaction).not.toHaveBeenCalled();
  });

  it('starts the transaction in the route-level interceptor', async () => {
    const { prisma, runInTransaction, next } = setup();
    const interceptor = new BodyFirstTransactionInterceptor(prisma);
    await lastValueFrom(interceptor.intercept(context('POST', Routes.prototype.upload), next));
    expect(runInTransaction).toHaveBeenCalledOnce();
  });
});
