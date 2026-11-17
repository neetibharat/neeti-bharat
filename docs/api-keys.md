# API keys

An API key lets a script or an AI agent, such as Claude Code, call the API without signing in. An admin makes keys under **Settings → API keys**.

## What a key is

- A key belongs to one organisation. It cannot reach another, and a request that names a different organisation in `x-organization-id` is still answered for the key's own.
- A key has a role: **admin** (everything an admin can do, including people), **member** (reads and changes things) or **auditor** (only reads). Whatever the role, a key cannot make, list or revoke keys, or start an organisation, set up AI help, or read a policy from a file with the company’s AI key: those are for people, so a leaked key cannot make more keys.
- A key acts as the person who made it. The activity log names that person on everything the key changes. If that person's role is lowered, the key gets the lower of the two roles. If they leave the organisation, the key stops working.
- A key can expire after 30, 90 or 365 days, or never. An admin can revoke it at any time, and it stops working at once.
- An organisation can have 25 keys that have not been revoked or run out.

Making and revoking a key are written to the activity log (`API_KEY_CREATED`, `API_KEY_REVOKED`), with the key's name and role. The key itself is never logged.

## Using a key

Send it in the `x-api-key` header. No cookie and no `x-organization-id` header are needed:

```
curl -H "x-api-key: dpdp_…" https://your-api-address/v1/breaches?tab=open
```

A key that is wrong, revoked or expired is answered with `UNAUTHENTICATED` (401). A route the key's role does not allow is answered with `FORBIDDEN` (403). The routes and what they take are listed in the API's Swagger page.

## How keys are kept

A key is `dpdp_` followed by 32 random bytes in hex. It is shown once, when it is made. Only its SHA-256 hash is stored, with the first characters so a list can tell keys apart. The key is random, so the hash needs no salt, and a request finds its key by that hash. The time a key was last used is noted at most once a minute.

## In the code

- `apps/api/src/api-keys/`: the table, the admin routes (`GET`, `POST` and `DELETE` on `/v1/api-keys`, admin only) and `ApiKeyAdmission`, which turns a key into a person, an organisation and a role.
- `RequestAccessGuard` calls `ApiKeyAdmission` when the header is present, puts the creator on the request as the session, and leaves the organisation and role for `OrganizationGuard`, which uses them instead of looking up a membership. Routes marked `@NoOrganization`, such as `GET /v1/me`, and routes marked `@NoApiKey`, which is the API key routes, are refused to keys.
- `apps/api/test/api-keys.e2e.test.ts` runs the real API and checks the rules above.
