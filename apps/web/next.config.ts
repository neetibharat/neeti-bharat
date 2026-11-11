import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// The single .env lives at the repo root, not in apps/web.
const rootEnv = resolve(process.cwd(), '../../.env');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

// The browser only ever talks to the web origin; these paths are forwarded to the API.
const apiUrl = process.env.API_URL ?? 'http://localhost:3201';

const { version } = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
  version: string;
};

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: version },
  rewrites: async () => [
    { source: '/api/:path*', destination: `${apiUrl}/api/:path*` },
    { source: '/v1/:path*', destination: `${apiUrl}/v1/:path*` },
  ],
};

export default withNextIntl(nextConfig);
