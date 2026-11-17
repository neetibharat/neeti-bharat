# DPDP Kit

Open-source, self-hosted toolkit for complying with India's Digital Personal Data Protection Act.

> Working name. The product name and licence are not decided yet.

## Layout

| Path              | What it is                                                   |
| ----------------- | ------------------------------------------------------------ |
| `apps/api`        | NestJS API with Prisma and Postgres                          |
| `apps/web`        | Next.js app, translated with next-intl                       |
| `apps/mcp`        | MCP server that lets Claude set up a company through the API |
| `packages/shared` | Types, constants and the DPDP catalogue used by both apps    |

## Quick start

Requires Node 22.12 or newer, pnpm 10, and Docker.

```sh
pnpm install
cp .env.example .env
pnpm db:up
pnpm dev
```

The web app runs on http://localhost:3200 and the API on http://localhost:3201/v1/health.

## Everyday commands

| Command       | Does                                    |
| ------------- | --------------------------------------- |
| `pnpm check`  | Format check, lint, typecheck and tests |
| `pnpm build`  | Builds every package                    |
| `pnpm format` | Formats the whole repo                  |
| `pnpm db:up`  | Starts Postgres and MinIO in Docker     |

See [CONTRIBUTING.md](CONTRIBUTING.md) for the standards and [docs/architecture.md](docs/architecture.md) for how the pieces fit. To configure email, sign-in and file storage for proof, see [docs/self-hosting.md](docs/self-hosting.md). For how a personal data breach is handled, see [docs/breaches.md](docs/breaches.md). For how requests and complaints from people are handled, see [docs/requests.md](docs/requests.md). For the audit pack and CSV downloads, see [docs/exports.md](docs/exports.md). For the website check, see [docs/website-check.md](docs/website-check.md). For how one install holds several organisations, see [docs/organizations.md](docs/organizations.md). For the set-up of a new organisation and the readiness check, see [docs/onboarding.md](docs/onboarding.md). For keys that let a script or an AI agent call the API, see [docs/api-keys.md](docs/api-keys.md). For checking Azure and Entra ID against the Act, see [docs/connections.md](docs/connections.md). For the notices about work that is due or late, see [docs/notifications.md](docs/notifications.md). For letting Claude set up a company through the API, see [docs/mcp.md](docs/mcp.md). For reading a policy from a file with an AI service, see [docs/ai-help.md](docs/ai-help.md).
