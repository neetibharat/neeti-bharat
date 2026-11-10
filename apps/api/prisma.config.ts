import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: '../../.env', quiet: true });

// `prisma generate` never connects, so it must work before a .env exists.
const UNSET_URL = 'postgresql://unset:unset@unset:5432/unset';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? UNSET_URL },
});
