# Organisations

One install can hold many organisations. Each has its own people, company profile, frameworks, policies, proof, breaches, requests, files, website checks, logo and activity log, and none of it is visible from another. One account can belong to several organisations, with a different role in each.

## Accounts, memberships and roles

An account (`users`) belongs to the whole install. A **membership** joins an account to an organisation and holds the role there (`admin`, `member` or `auditor`). Someone who leaves an organisation keeps the membership row, switched off (`disabledAt`); their account and their memberships elsewhere are untouched. Their sessions end only when no other organisation is left that they can open.

A role is only ever checked against the organisation a request is for. A person who is an admin of one organisation and an auditor of another can change things in the first and only read in the second.

## Which organisation a request is for

The web app sends the header `x-organization-id` on every call. `RequestAccessGuard` is the one global guard (the library's own global guard is switched off with `disableGlobalAuthGuard` on `forRootAsync`). It runs the sign-in check first, which is the library's session check or, for a request with an `x-api-key` header, the key check described in [api-keys.md](api-keys.md), and then `OrganizationGuard`, in that order, so the second never sees a request the first has not looked at. `OrganizationGuard`:

1. loads the organisations the person can open (an active membership);
2. uses the one the header names, or the only one they have when the header is missing;
3. refuses with `FORBIDDEN` (403) when they do not belong to the named one, or when their role there is not in the route's `@Roles` list;
4. refuses with `ORGANIZATION_REQUIRED` (400) when they belong to several and the header is missing, or to none.

`@Roles` and `@NoOrganization` come from `core/org/roles.decorator.ts`; the library's `@Roles`, which reads one role off the account, is not used. `@NoOrganization` marks the few routes that are not about one organisation: `GET /v1/me`, `GET /v1/organizations` and `POST /v1/organizations`.

## How data is kept apart

Every tenant table carries `organizationId`, and a request's organisation is held in an `AsyncLocalStorage` (`core/org/org-context.ts`). Two things keep one organisation out of another, one for each direction:

- **Reading, changing and deleting.** A Prisma client extension (`core/prisma/tenant-extension.ts`) adds the request's organisation to the `where` of every query on a tenant model, whatever the repository wrote. A query that runs with no organisation fails instead of reading everything.
- **Creating.** The repository writes `organizationId` into what it creates (`orgOwned()`), and the compiler refuses a create that leaves it out. The extension then checks that it is the request's organisation and refuses the row if it is not.

Catalogue rows are looked up by organisation and id with `orgKey(id)`.

These models are not scoped by the extension because they span organisations: `User`, `Session`, `Account`, `Verification`, `Organization`, `Membership` and `Invitation`. Invitations are scoped in their repository.

Rows identified by a catalogue id (`Framework`, `Requirement`, `Control`, `ProofRequirement`, `Policy`) have the key `(organizationId, id)`, so every organisation has its own `DPDP-R6-01`. Child rows reference them with the organisation as part of the foreign key.

- **Activity log.** Each organisation has its own hash chain and its own anchor (`activity_anchor` has one row per organisation). Writers to one organisation's chain take a lock named after the organisation, so two organisations never wait on each other. The integrity check walks one organisation's chain.
- **REQ numbers.** Each organisation counts from 1. `organizations.requestCounter` is incremented in the request's transaction, so two requests logged at once never share a number.
- **Files.** The bucket is shared, and new files are kept under `organizations/<organisation id>/`. Which object belongs to whom is known from rows, which are scoped, so one organisation cannot ask for another's file.

## Starting an organisation

`POST /v1/organizations` with `{ "name": "Acme Pvt Ltd" }` creates the organisation and makes the caller its admin. In that organisation it then copies the DPDP checklist (frameworks, rules, controls, policies and proof requirements), adds the caller as a person, and writes `ORGANIZATION_CREATED` as the first event of its log. The API also adds any catalogue rows an organisation is missing at start-up, for every organisation, so a new release reaches all of them.

A new organisation is then set up by its admin: see [onboarding](onboarding.md).

An install that was running before organisations existed has one organisation after the migration, holding everything it had. It is named after the Company name answer in the profile, or "My organisation", and everyone with an account is a member with the role they had.

## Who can sign in and make organisations

A new account needs the first-install claim (`INITIAL_ADMIN_EMAIL`, the only email that may claim a new install; required in production) or an invitation from any organisation. An account that already exists can always sign in, whichever organisations it belongs to. Anyone who can sign in can create an organisation. There are no settings for either.

## Invitations across organisations

An invitation belongs to the organisation that sent it. Each time a session starts (every sign-in), the person joins every organisation that has an open invitation to them, so an organisation that invites someone who already has an account appears the next time they sign in. `GET /v1/me` only reads. In each organisation the person is added to People and `USER_CREATED` is written to that organisation's log. The same email can have an open invitation from several organisations at once.

## In the web app

The sidebar shows an organisation switcher above the signed-in person. It lists the organisations they can open and "Create an organisation". The choice is kept in the `dpdp_org` cookie. Switching reloads the app, so nothing from the organisation just left stays on screen or in the cache. A person who belongs to no organisation is sent to `/new-organization` after signing in. The same page, reached from the switcher, makes another one.

## Tests

`apps/api/test/organizations.e2e.test.ts` runs the real API against a database made for the run (`pnpm test:e2e`, and in CI). It signs three people in through the email link, makes two organisations, puts records in each, and checks that nothing crosses: lists, records opened by id, the company profile, readiness checks, REQ numbers, the checklist copy, each activity log and its integrity check, and CSV downloads. It also checks the access rules (no sign-in, an organisation the person is not in, several organisations and no header, a role that is allowed in one organisation and not another), and calls every GET route of the API in each organisation (and again with an API key) to see that none fails with a server error. The test database is made on the server named by `E2E_DATABASE_URL` or `DATABASE_URL` and is removed afterwards. The app is started from a directory with no `.env`, and the run stops before writing anything if the app is not using the test database.
