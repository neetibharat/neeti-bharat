# Contributing

Run `pnpm check` before opening a PR. CI runs the same command.

## Commits

[Conventional Commits](https://www.conventionalcommits.org), header up to 100 characters.
Allowed scopes: `api`, `web`, `shared`, `deps`, `ci`, `docs`, `repo`.

## Code standards

- TypeScript is strict. No `any` without a reason.
- Functions stay small and flat. ESLint caps length, complexity, nesting and parameters.
- Name things so the code explains itself. Write a comment only for something the code cannot say: a reason, a rule from the law, a trap. Comments are one line where possible.
- No `console`. Use the Nest `Logger` in the API.
- Tests sit next to the code as `*.test.ts`.

## API

- One folder per feature: `controllers`, `services`, `repositories`, `dto`, plus `<feature>.module.ts`.
- Controllers handle HTTP only. Services hold business rules. Repositories hold all database queries.
- There is exactly one Prisma client, `PrismaService`. Only repositories inject it. ESLint blocks `new PrismaClient()` and blocks services and controllers from importing it.
- Environment variables are declared and validated in `core/config/env.validation.ts`. Add new ones there and in `.env.example`.
- Schema changes are one small migration with only the models agreed in review. Every `DateTime` is `@db.Timestamptz(3)`.

## Languages (i18n)

- The product is translated. English is the source; every locale lives in `apps/web/messages/<locale>.json`.
- Never hard-code user-facing text in the web app. Add a key and use `useTranslations`.
- The API never sends user-facing prose. It sends an error code from `packages/shared`, and the web app shows `errors.<code>`.
- Adding a locale: add its code to `packages/shared/src/locales.ts`, then add its message file. The tests fail until every key is translated.
- Translations need review by a fluent speaker before release.
