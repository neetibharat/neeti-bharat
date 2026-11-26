import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';

// The tests are run from apps/api.
const API_ROOT = process.cwd();

/** The server to make the test database on: `E2E_DATABASE_URL`, or the app's own `DATABASE_URL`. */
function serverUrl(): URL {
  const rootEnv = resolve(API_ROOT, '../../.env');
  if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);
  const url = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url)
    throw new Error(
      'Set E2E_DATABASE_URL (or DATABASE_URL) to a PostgreSQL server for the end-to-end tests',
    );
  return new URL(url);
}

const withDatabase = (server: URL, name: string): string => {
  const url = new URL(server);
  url.pathname = `/${name}`;
  url.search = '';
  return url.toString();
};

export interface TestDatabase {
  url: string;
  drop: () => Promise<void>;
}

/** Makes an empty database with every migration applied, and a way to remove it afterwards. */
export async function createTestDatabase(): Promise<TestDatabase> {
  const server = serverUrl();
  const name = `app_e2e_${randomBytes(6).toString('hex')}`;
  const admin = new PrismaClient({
    adapter: new PrismaPg({ connectionString: withDatabase(server, 'postgres') }),
  });
  await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
  const url = withDatabase(server, name);
  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    cwd: API_ROOT,
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
    shell: true,
  });
  return {
    url,
    drop: async () => {
      await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
      await admin.$disconnect();
    },
  };
}
