# Rules for Claude

pnpm monorepo: `apps/api` (NestJS 12, Prisma 7), `apps/web` (Next.js 16, next-intl), `packages/shared`.
Full standards are in `CONTRIBUTING.md`. Run `pnpm check` before saying work is done.
New work follows the patterns of the module closest to it (People for lists and forms, Frameworks and Proof for paging and counts). Read that module first and copy its structure.

## Hard rules

- **Git:** commit or push only when asked. Conventional commits, header up to 100 characters. No co-author trailer.
- **Prisma:** one client (`PrismaService`), used only in repositories, through `this.prisma.db` (or `this.prisma.transact` for several steps). Never `new PrismaClient()`. One small migration at a time, only agreed models. Every `DateTime` is `@db.Timestamptz(3)`. A migration that is committed is never edited: add a new one.
- **Enums:** a Prisma enum has a matching list in `packages/shared` and an entry in `core/prisma/enums.test.ts`.
- **Writes:** every request that changes something runs in one database transaction (`TransactionInterceptor`). The service saves the change and calls `ActivityService.record` in the same call. A new action needs a sentence and a filter name in `apps/web/messages/en.json`.
- **Routes:** every route has `@Roles`. Admins and members change things; auditors only read.
- **Lists:** paged (`page`, `limit`), with counts for their tabs, and they send only what the screen shows. The search and filters run in the API.
- **Errors:** the API sends codes from `packages/shared`, never prose. Add the code and its message to `apps/web/messages/en.json`.
- **Text:** no hard-coded user-facing strings in the web app. Add keys to `apps/web/messages/en.json`; it is the only active locale.
- **Web UI:** build from `components/base` and the tokens in `styles/theme.css`. No raw colours, sizes or radii. Show `PageSkeleton` while loading and an `Alert` on error.
- **Comments:** one line, only for a reason, a legal rule or a trap. Never restate the code.
- **Functions:** small and flat; the lint limits are the ceiling, not the target.
- **Docs:** describe how things work today. Do not write what changed, what used to be, or what is coming.
- **Dependencies:** latest stable. Do not add one the task does not need.
- **Env:** new variables go in `core/config/env.validation.ts` and `.env.example`.
- **Servers:** never stop the dev servers on ports 3200 and 3201. Live-test only on a throwaway database and API port 3211, and stop only that process afterwards.
- **Audit log:** never update or delete rows in `activity_events`.
- **Never edit this file** unless asked.
