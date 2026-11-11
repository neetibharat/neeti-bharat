# Self-hosting: setup

Everything is set with environment variables in one `.env` file at the repo root. Start from `.env.example`.

> The Docker images for the web app and API are not built yet. Until they are, run the app with `pnpm dev`. The settings below stay the same when Docker arrives.

## 1. Required settings

| Variable              | What it is                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string                                                                   |
| `WEB_ORIGIN`          | The address people open in the browser, for example `https://dpdp.yourcompany.in`              |
| `API_PORT`            | The port the API listens on (default `3201`)                                                   |
| `API_URL`             | Where the web server reaches the API (default `http://localhost:3201`)                         |
| `INITIAL_ADMIN_EMAIL` | The only email that may claim a new install and become its first admin. Required in production |
| `BETTER_AUTH_SECRET`  | A random string of at least 32 characters. Make one with `openssl rand -base64 32`             |

Keep `BETTER_AUTH_SECRET` private and never change it later, or everyone is signed out.

## 2. Email (needed in production)

Sign-in links and invitations are sent by email through any SMTP server: Google Workspace, Microsoft 365, or a service such as SES or Resend over SMTP.

```
SMTP_HOST=smtp.yourcompany.in
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
SMTP_FROM="DPDP Kit <no-reply@yourcompany.in>"
```

With `SMTP_HOST` empty, links are printed to the API log. That works for development only; the API refuses to start in production without SMTP.

## 3. Who can sign in

- The first person to sign in becomes the **admin**. Set `INITIAL_ADMIN_EMAIL` to the address that may do this: it is required in production, so nobody else can claim a new install. Without it (development only), anyone can.
- After that, only people an admin has given a login can sign in: add them under Settings, People, which sends the invitation.
- Sign-in methods: an email link (always on), plus Google and Microsoft if you set them up below.

## 4. Microsoft sign-in (optional)

1. In the [Entra admin center](https://entra.microsoft.com), go to **App registrations → New registration**.
2. Choose **Single tenant only** (your organisation).
3. Under **Redirect URI**, pick **Web** and enter `<WEB_ORIGIN>/api/auth/callback/microsoft`.
4. After registering, copy the **Application (client) ID** and **Directory (tenant) ID**.
5. Go to **Certificates & secrets → New client secret** and copy the secret **Value** straight away.
6. Set:

```
MICROSOFT_CLIENT_ID=<application (client) id>
MICROSOFT_CLIENT_SECRET=<secret value>
MICROSOFT_TENANT_ID=<directory (tenant) id>
```

Secrets expire. Note the expiry date and make a new one before then.

Leaving `MICROSOFT_TENANT_ID` as `common` lets any Microsoft account try to sign in. Invitations still apply, but use your tenant id for a company install.

## 5. Google sign-in (optional)

1. In the [Google Cloud console](https://console.cloud.google.com), open **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Choose **Web application**.
3. Add the authorised redirect URI `<WEB_ORIGIN>/api/auth/callback/google`.
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## 6. Check it works

1. Restart the API after changing `.env`.
2. Open `WEB_ORIGIN`. Google and Microsoft buttons show only when set up.
3. Sign in. The first person becomes the admin, then invite everyone else.

If a provider says the redirect does not match, the redirect URI in its console must be exactly `<WEB_ORIGIN>/api/auth/callback/<provider>`, including `http` or `https`.
