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
- After that, only people an admin has given a login can sign in: add them under Settings, People, which sends the invitation. An invitation is valid for 7 days. **Resend invitation** on the person's row sends a fresh link for another 7 days, also after the first one has run out.
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

## 6. Storage for proof files (optional)

Proof can be a file. Files are kept in any S3-compatible service: AWS S3, MinIO, Cloudflare R2, DigitalOcean Spaces or Backblaze B2. Azure Blob is not S3-compatible and is not supported yet.

| Variable                    | What it is                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| `STORAGE_BUCKET`            | The bucket name. Leave it empty to switch file uploads off                                              |
| `STORAGE_REGION`            | The region (default `us-east-1`)                                                                        |
| `STORAGE_ENDPOINT`          | The service address, for services other than AWS S3                                                     |
| `STORAGE_ACCESS_KEY_ID`     | The access key. Set it together with the secret, or leave both empty to use the default AWS credentials |
| `STORAGE_SECRET_ACCESS_KEY` | The secret for that key                                                                                 |
| `STORAGE_FORCE_PATH_STYLE`  | `true` for services that want the bucket in the path, such as MinIO (default `false`)                   |

The bucket must be private. The API uploads files itself, and people download through links that last 5 minutes. The browser opens those links, so `STORAGE_ENDPOINT` must be an address people can reach, not only the API.

**AWS S3.** Create a private bucket and a user that may put, get and delete objects in it.

```
STORAGE_BUCKET=dpdp-proof
STORAGE_REGION=ap-south-1
STORAGE_ACCESS_KEY_ID=...
STORAGE_SECRET_ACCESS_KEY=...
```

On AWS itself, leave the keys empty to use the role of the machine the API runs on.

**MinIO with Docker Compose.** `pnpm db:up` starts MinIO on `127.0.0.1:9000` (console on `9001`) and creates the bucket. Use:

```
STORAGE_BUCKET=dpdp-proof
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY_ID=dpdpminio
STORAGE_SECRET_ACCESS_KEY=dpdpminio-secret
STORAGE_FORCE_PATH_STYLE=true
```

Those keys are for development. Docker Compose reads the same two variables, so change them in `.env` before first start for anything else.

**Cloudflare R2.** Create a bucket and an API token with object read and write, then:

```
STORAGE_BUCKET=dpdp-proof
STORAGE_REGION=auto
STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY_ID=...
STORAGE_SECRET_ACCESS_KEY=...
```

Without `STORAGE_BUCKET`, the app runs as before: proof can be links and notes, the drop-zone shows "File storage is not set up" and stays off, and an upload sent to the API directly is refused with `STORAGE_NOT_CONFIGURED` (503). Setting only one of the two keys stops the API from starting.

## 7. Check it works

1. Restart the API after changing `.env`.
2. Open `WEB_ORIGIN`. Google and Microsoft buttons show only when set up.
3. Sign in. The first person becomes the admin, then invite everyone else.

If a provider says the redirect does not match, the redirect URI in its console must be exactly `<WEB_ORIGIN>/api/auth/callback/<provider>`, including `http` or `https`.
