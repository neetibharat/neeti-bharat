import {
  Injectable,
  SetMetadata,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { from, lastValueFrom, type Observable } from 'rxjs';
import { PrismaService } from './prisma.service';

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const AFTER_BODY = 'transaction:after-body';

/**
 * Marks a route whose body is read by its own interceptor (a file upload). The request-wide transaction skips it, so
 * the transaction does not wait on a slow upload; the route lists `BodyFirstTransactionInterceptor` after the reader.
 */
export const TransactionAfterBody = () => SetMetadata(AFTER_BODY, true);

function inTransaction(
  prisma: PrismaService,
  context: ExecutionContext,
  next: CallHandler,
): Observable<unknown> {
  const method = String(context.switchToHttp().getRequest<{ method?: string }>().method ?? '');
  if (READ_METHODS.has(method.toUpperCase())) return next.handle();
  return from(prisma.runInTransaction(() => lastValueFrom(next.handle())));
}

/**
 * Wraps every request that changes something in one database transaction, so a change and its activity log entry
 * are saved together or not at all. Reads are left alone.
 */
@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (this.reflector.get<boolean>(AFTER_BODY, context.getHandler())) return next.handle();
    return inTransaction(this.prisma, context, next);
  }
}

/** The same transaction, started once the route's own interceptor has finished reading the body. */
@Injectable()
export class BodyFirstTransactionInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return inTransaction(this.prisma, context, next);
  }
}
