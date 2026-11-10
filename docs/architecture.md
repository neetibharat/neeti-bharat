# Architecture

```
apps/web ──HTTP──▶ apps/api ──Prisma──▶ Postgres
     └──── packages/shared ────┘
```

## Request flow in the API

Controller validates input and calls a service. The service applies business rules and calls repositories. A repository runs the query through the single `PrismaService`.

```
controller → service → repository → PrismaService → Postgres
```

Failures end in `AllExceptionsFilter`, which returns `{ statusCode, code, params? }`. Prisma errors and Nest HTTP exceptions are mapped to codes in `core/common/error-mapper.ts`.

## Shared package

`packages/shared` is plain ESM built with `tsc`. It holds only what both apps must agree on: locales, error codes and response types. It has no runtime dependencies.

## Internationalisation

- Locales are defined once in `packages/shared`.
- The web app routes by locale prefix (`/en`, `/hi`) and loads one message file per request.
- Translation keys are type-checked against `messages/en.json`.
- Tests enforce that every locale has the same keys and that every API error code has a message.

## Folder map of the API

```
src/
  main.ts
  app.module.ts
  core/
    config/    environment validation
    prisma/    the single database client
    common/    exceptions and error mapping
    health/    liveness and database check
  generated/   Prisma client (git-ignored)
```

Feature code goes in `src/<area>/<feature>/`, next to `core/`.
