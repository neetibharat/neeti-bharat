import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// The single .env lives at the repo root, not in apps/web.
const rootEnv = resolve(process.cwd(), '../../.env');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

// The browser only ever talks to the web origin; these paths are forwarded to the API.
const apiUrl = process.env.API_URL ?? 'http://localhost:3201';

// An AI call can take up to 120 seconds on the API (see ai-client.ts). The proxy waits a little longer than that, so a slow
// answer comes back as the API's own "did not answer in time" and not as a dropped connection. Next's default is 30.
const API_PROXY_TIMEOUT_MS = 130_000;

const nextConfig: NextConfig = {
  experimental: { proxyTimeout: API_PROXY_TIMEOUT_MS },
  rewrites: async () => [
    { source: '/api/:path*', destination: `${apiUrl}/api/:path*` },
    { source: '/v1/:path*', destination: `${apiUrl}/v1/:path*` },
  ],
};

export default withNextIntl(nextConfig);
