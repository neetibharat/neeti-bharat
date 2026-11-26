# Self-hosting: setup

Everything is set with environment variables in one `.env` file at the repo root. Start from `.env.example`.

> The Docker images for the web app and API are not built yet. Until they are, run the app with `pnpm dev`. The settings below stay the same when Docker arrives.

## 1. Required settings

| Variable              | What it is                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string                                                                        |
| `WEB_ORIGIN`          | The address people open in the browser, for example `https://neeti.yourcompany.in`                  |
| `API_PORT`            | The port the API listens on (default `3201`)                                                        |
| `API_URL`             | Where the web server reaches the API (default `http://localhost:3201`)                              |
| `INITIAL_ADMIN_EMAIL` | The only email that may claim a new install and make its first organisation. Required in production |
| `BETTER_AUTH_SECRET`  | A random string of at least 32 characters. Make one with `openssl rand -base64 32`                  |

Keep `BETTER_AUTH_SECRET` private and never change it later, or everyone is signed out.

## 2. Email (needed in production)

Sign-in links and invitations are sent by email through any SMTP server: Google Workspace, Microsoft 365, or a service such as SES or Resend over SMTP.

```
SMTP_HOST=smtp.yourcompany.in
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
SMTP_FROM="Neeti Bharat <no-reply@yourcompany.in>"
```

With `SMTP_HOST` empty, links are printed to the API log. That works for development only; the API refuses to start in production without SMTP.

## 3. Who can sign in

- The first person to sign in makes the first organisation and becomes its **admin**. Set `INITIAL_ADMIN_EMAIL` to the address that may do this: it is required in production, so nobody else can claim a new install. Without it (development only), anyone can.
- After that, only people an admin has given a login can sign in: add them under Settings, People, which sends the invitation. See [organisations](organizations.md) for how one install holds several. An invitation is valid for 7 days. **Resend invitation** on the person's row sends a fresh link for another 7 days, also after the first one has run out.
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

## 6. Secrets for connections (optional)

Connections to outside systems, such as an Azure subscription, need secrets that Neeti Bharat can read back. They are sealed with a key you hold. Set `SECRETS_ENCRYPTION_KEY` to 32 random bytes in base64:

```
openssl rand -base64 32
```

Without it, the Connections page says it cannot keep a secret. Keep the key safe and do not change it once connections exist: values sealed with the old key cannot be opened with a new one, and they would have to be added again. See [connections.md](connections.md).

## 7. AI help (optional)

[AI help](ai-help.md) uses one AI service for the whole install. Set all three in `.env`, then restart the API, and an admin turns on the features under **Settings, AI help**. Leave them empty and AI help is off.

| Variable      | What it is                                                                       |
| ------------- | -------------------------------------------------------------------------------- |
| `AI_PROVIDER` | `openai`, `anthropic` or `deepseek`                                              |
| `AI_MODEL`    | The model's exact name. Optional for Anthropic and DeepSeek, required for OpenAI |
| `AI_API_KEY`  | Your own key for that service. Set it together with `AI_PROVIDER`                |

When someone uses a feature, the text it needs is sent to that service with this key.

## 8. Storage for proof files (optional)

Proof can be a file. Files are kept in any S3-compatible service (AWS S3, MinIO, Cloudflare R2, DigitalOcean Spaces or Backblaze B2) or in Azure Blob Storage. Set the S3 settings or the Azure ones, not both.

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
STORAGE_BUCKET=neeti-proof
STORAGE_REGION=ap-south-1
STORAGE_ACCESS_KEY_ID=...
STORAGE_SECRET_ACCESS_KEY=...
```

On AWS itself, leave the keys empty to use the role of the machine the API runs on.

**MinIO with Docker Compose.** `pnpm db:up` starts MinIO on `127.0.0.1:9000` (console on `9001`) and creates the bucket. Use:

```
STORAGE_BUCKET=neeti-proof
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY_ID=neetiminio
STORAGE_SECRET_ACCESS_KEY=neetiminio-secret
STORAGE_FORCE_PATH_STYLE=true
```

Those keys are for development. Docker Compose reads the same two variables, so change them in `.env` before first start for anything else.

**Azure Blob Storage.** Create a storage account and a private container in it (public access off), then copy one of the account's access keys from the Azure portal (Security + networking, Access keys). Set the three together and leave `STORAGE_BUCKET` empty:

```
AZURE_STORAGE_ACCOUNT=<storage account name>
AZURE_STORAGE_KEY=<an access key of that account>
AZURE_STORAGE_CONTAINER=<container name>
```

The key stays on the server. People download through links signed with it that last 5 minutes, so the storage account's address (`https://<account>.blob.core.windows.net`) must be reachable from the browser, and its firewall must allow the people who download. `AZURE_STORAGE_ENDPOINT` is only for the Azurite emulator, for example `http://127.0.0.1:10000/devstoreaccount1`. If a key is ever shared by mistake, rotate it in the portal and update `.env`.

**Cloudflare R2.** Create a bucket and an API token with object read and write, then:

```
STORAGE_BUCKET=neeti-proof
STORAGE_REGION=auto
STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY_ID=...
STORAGE_SECRET_ACCESS_KEY=...
```

Without `STORAGE_BUCKET`, the app runs as before: proof can be links and notes, the drop-zone shows "File storage is not set up" and stays off, and an upload sent to the API directly is refused with `STORAGE_NOT_CONFIGURED` (503). Setting only one of the two keys stops the API from starting.

The same bucket holds the company logo, under `logo/`. An admin uploads it in Settings, General: a PNG, JPG or WebP up to 2 MB (an SVG is refused because it can carry scripts). A new logo replaces the old one, and the old picture is deleted from the bucket. `GET /v1/company-logo` returns a link that works for 5 minutes, or `null` when no logo is set or storage is off; `PUT` and `DELETE` are for admins only. Each change is written to the activity log.

## 9. Check it works

1. Restart the API after changing `.env`.
2. Open `WEB_ORIGIN`. Google and Microsoft buttons show only when set up.
3. Sign in. The first person makes the organisation and becomes its admin, then invites everyone else.

If a provider says the redirect does not match, the redirect URI in its console must be exactly `<WEB_ORIGIN>/api/auth/callback/<provider>`, including `http` or `https`.
