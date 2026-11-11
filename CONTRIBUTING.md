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

- One folder per feature: `controllers`, `services`, `repositories`, `dto` and `utils` (small pure helpers), plus `<feature>.module.ts`. Add only the folders the feature needs. Never put these files loose in the feature root.
- Controllers handle HTTP only. Services hold business rules. Repositories hold all database queries.
- There is exactly one Prisma client, `PrismaService`. Only repositories inject it. ESLint blocks `new PrismaClient()` and blocks services and controllers from importing it.
- Environment variables are declared and validated in `core/config/env.validation.ts`. Add new ones there and in `.env.example`.
- `packages/shared` is an ES module package and the API is CommonJS, so the API loads it with Node's `require(esm)`. That needs Node 22.12 or later (`engines` and `.nvmrc` say so). Run `pnpm --filter @dpdp-kit/shared dev` (or `build`) after editing shared so the running apps see the change.
- Every `*Role`, `*Status` and similar list in `packages/shared` that is also a Prisma enum must match it: a test in `core/prisma/enums.test.ts` fails when they drift. CI also fails when `schema.prisma` and the migrations disagree.
- Schema changes are one small migration with only the models agreed in review. Every `DateTime` is `@db.Timestamptz(3)`.

## Languages (i18n)

- English is the only active locale and the source; every locale lives in `apps/web/messages/<locale>.json`.
- Never hard-code user-facing text in the web app. Add a key and use `useTranslations`.
- The API never sends user-facing prose. It sends an error code from `packages/shared`, and the web app shows `errors.<code>`.
- Adding a locale: add its code to `packages/shared/src/locales.ts`, then add its message file. The tests fail until every key is translated.
- `apps/web/messages/hi.json` is parked: `LOCALES` lists only `en`, so only `en.json` is checked (keys, empty messages, error codes) and `hi.json` may fall behind until Hindi is reviewed.
- Translations need review by a fluent speaker before release.

## Web UI

- Build screens from `apps/web/src/components/base`. No raw colours, sizes or radii in feature code: use the tokens in `styles/theme.css`.
- Read `docs/design-system.md`. Every component is shown at `/en/design-system` in development.
