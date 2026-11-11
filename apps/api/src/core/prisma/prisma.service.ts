import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Prisma, PrismaClient } from '../../generated/prisma/client';
import type { Env } from '../config/env.validation';

/** The transaction the current request is running in, if it opened one. */
const openTransaction = new AsyncLocalStorage<Prisma.TransactionClient>();

/** Longest a request's writes may take, in milliseconds. */
const TRANSACTION_TIMEOUT = 15_000;

/**
 * The only Prisma client in the app. Only repositories may inject it;
 * ESLint blocks `new PrismaClient()` and imports from services and controllers.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /** The client itself. Prisma hands back a proxy from its constructor, so `this` inside a getter is not it. */
  private readonly client: Prisma.TransactionClient;

  constructor(config: ConfigService<Env, true>) {
    super({
      adapter: new PrismaPg({ connectionString: config.get('DATABASE_URL', { infer: true }) }),
    });
    this.client = this;
  }

  /** What repositories query through: the request's transaction while there is one, the client otherwise. */
  get db(): Prisma.TransactionClient {
    return openTransaction.getStore() ?? this.client;
  }

  /** Runs `work` in one transaction. Inside an open one, it simply joins it. */
  transact<T>(work: (db: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    const open = openTransaction.getStore();
    return open ? work(open) : this.$transaction(work);
  }

  /** Runs `work` so that every repository call inside it shares one transaction: all of it happens, or none of it. */
  runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    if (openTransaction.getStore()) return work();
    return this.$transaction((tx) => openTransaction.run(tx, work), {
      timeout: TRANSACTION_TIMEOUT,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
