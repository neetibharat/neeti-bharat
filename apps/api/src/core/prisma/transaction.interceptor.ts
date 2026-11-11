import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { from, lastValueFrom, type Observable } from 'rxjs';
import { PrismaService } from './prisma.service';

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Wraps every request that changes something in one database transaction, so a change and its activity log entry
 * are saved together or not at all. Reads are left alone.
 */
@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const method = String(context.switchToHttp().getRequest<{ method?: string }>().method ?? '');
    if (READ_METHODS.has(method.toUpperCase())) return next.handle();
    return from(this.prisma.runInTransaction(() => lastValueFrom(next.handle())));
  }
}
