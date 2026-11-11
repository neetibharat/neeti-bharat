# DPDP Kit

Open-source, self-hosted toolkit for complying with India's Digital Personal Data Protection Act.

> Working name. The product name and licence are not decided yet.

## Layout

| Path              | What it is                                                |
| ----------------- | --------------------------------------------------------- |
| `apps/api`        | NestJS API with Prisma and Postgres                       |
| `apps/web`        | Next.js app, translated with next-intl                    |
| `packages/shared` | Types, constants and the DPDP catalogue used by both apps |

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

See [CONTRIBUTING.md](CONTRIBUTING.md) for the standards and [docs/architecture.md](docs/architecture.md) for how the pieces fit. To configure email, sign-in and file storage for proof, see [docs/self-hosting.md](docs/self-hosting.md). For how a personal data breach is handled, see [docs/breaches.md](docs/breaches.md). For how requests and complaints from people are handled, see [docs/requests.md](docs/requests.md).
