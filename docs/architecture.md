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

`packages/shared` is plain ESM built with `tsc`. It holds what both apps must agree on: locales, error codes, response types, the limits on what can be sent, the DPDP catalogue (its rules, controls, policies and proof), and the rules that work out a control's status. It has no runtime dependencies.

## Internationalisation

- Locales are defined once in `packages/shared`.
- The web app routes by locale prefix (`/en`) and loads one message file per request.
- Translation keys are type-checked against `messages/en.json`.
- Tests enforce that every locale has the same keys and that every API error code has a message.

## One transaction per change

Every request that changes something runs in one database transaction (`TransactionInterceptor`). Repositories read and write through `PrismaService.db`, which is that transaction while there is one. A change and its activity log entry are therefore saved together, and a request that fails halfway leaves nothing behind. Reads are not wrapped.

## File storage

Services that keep files depend on the abstract `FileStorage` in `core/storage` (`put`, `signedDownloadUrl`, `remove`, `isEnabled`), never on a provider's SDK. `S3FileStorage` is the one driver, for any S3-compatible service. With no `STORAGE_BUCKET` set, `DisabledFileStorage` is used instead and refuses every call with `STORAGE_NOT_CONFIGURED`. `createFileStorage` is the one place that picks the driver, so another (such as Azure Blob) is one more class and one more branch there. Tests use `MemoryFileStorage`.

## Folder map of the API

```
src/
  main.ts
  app.module.ts
  core/                shared plumbing: config, prisma, mail, storage, docs, error mapping, health
  <feature>/           one folder per feature, for example people/
    controllers/       HTTP only: read the request, call a service, return the result
    services/          the business rules
    repositories/      every database query (the only place that uses PrismaService)
    dto/               request shapes and their validation
    utils/             small pure helpers the feature needs
    <feature>.module.ts
  generated/           Prisma client (git-ignored)
```

Tests sit next to the file they test, as `*.test.ts`. A feature only gets the folders it needs: a feature with no routes has no `controllers/`.
