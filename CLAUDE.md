# Niti Bharat — rules for Claude

pnpm monorepo: `apps/api` (NestJS 12, Prisma 7), `apps/web` (Next.js 16, next-intl), `packages/shared`.
Full standards are in `CONTRIBUTING.md`. Run `pnpm check` before saying work is done.

## Hard rules

- **Git:** commit or push only when asked. Conventional commits, header up to 100 characters.
- **Prisma:** one client (`PrismaService`), used only in repositories. Never `new PrismaClient()`. One small migration at a time, only agreed models. Every `DateTime` is `@db.Timestamptz(3)`.
- **Errors:** the API sends codes from `packages/shared`, never prose. Add the code and its message in every locale.
- **Text:** no hard-coded user-facing strings in the web app. Add keys to every file in `apps/web/messages`.
- **Comments:** one line, only for a reason, a legal rule or a trap. Never restate the code.
- **Functions:** small and flat; the lint limits are the ceiling, not the target.
- **Dependencies:** latest stable. Do not add one the task does not need.
- **Env:** new variables go in `core/config/env.validation.ts` and `.env.example`.
- **Never edit this file** unless asked.
