# Connections

A connection lets DPDP Kit read a system that holds your data and check how it is set up against what the DPDP Act expects, such as whether storage is encrypted, whether a database is open to the internet, and whether everyone has a second sign-in step. The first provider is Microsoft Azure with Entra ID. Connections are under **Connections** in the sidebar.

DPDP Kit only reads. A connection signs in with an app registration that holds read-only roles, and no check changes anything in the system.

## Setting up Azure

An admin connects a subscription with the form on the Connections page, which also shows these steps:

1. In Microsoft Entra ID, open **App registrations** and choose **New registration**. Name it `DPDP Kit` and keep it single tenant.
2. On its Overview page, copy the **Application (client) ID** and the **Directory (tenant) ID**.
3. Under **Certificates and secrets**, make a client secret and copy its value. It is shown only once.
4. On the subscription, open **Access control (IAM)** and add the **Reader** role for the app. Copy the **Subscription ID**.
5. On the app, open **API permissions**, add the Microsoft Graph **application** permissions `Reports.Read.All`, `Policy.Read.All` and `Directory.Read.All`, and choose **Grant admin consent**.

Without the Graph permissions the three sign-in checks are shown as not checked and the rest still run. Without the Reader role the resource checks are shown as not checked.

Adding a connection signs in and reads the subscription first. If Microsoft refuses the details, nothing is kept and the form says whether the sign-in failed or the subscription cannot be seen.

## What is checked

| Check                                                    | What it looks at                                                                                                                      | Result                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Everyone has a second sign-in step                       | Members who have registered multi-factor authentication. Guests are left out                                                          | Fail if any member has not. People are counted, never named |
| A second step is required at sign-in                     | Security defaults, or an enabled conditional access policy for all users                                                              | Fail if neither                                             |
| A sensible number of global administrators               | Two to five holders of the Global Administrator role                                                                                  | Warn outside that range                                     |
| Storage requires HTTPS and TLS 1.2                       | Storage accounts                                                                                                                      | Fail for plain HTTP or TLS 1.0 and 1.1                      |
| Storage has no public access                             | Whether containers may be public                                                                                                      | Fail if allowed                                             |
| Key vaults can recover deleted keys                      | Soft delete and purge protection                                                                                                      | Fail without soft delete, warn without purge protection     |
| SQL servers require TLS 1.2                              | Minimum TLS version                                                                                                                   | Fail below 1.2                                              |
| SQL servers are not open to the internet                 | Public network access                                                                                                                 | Warn if enabled                                             |
| SQL auditing is on                                       | Auditing of each server, up to 50                                                                                                     | Fail if off                                                 |
| Data stores are in India                                 | Where storage accounts, SQL servers and key vaults are                                                                                | Warn for any outside India                                  |
| No remote login or database port is open to the internet | Network security groups: inbound allow rules from anywhere to SSH, RDP, SQL, MySQL, Postgres, SMB, WinRM, Redis, MongoDB or all ports | Fail if any                                                 |

A check that cannot answer is shown as not checked, with the reason: nothing of that kind was found, the app is not allowed to read it, or it did not finish. One check failing never stops the others. Where the check can name resources, the result lists up to five.

The Act lets personal data go abroad unless the government restricts a country, so a data store outside India is a warning to know about, not a failure.

## Running the checks

**Run checks** reads the subscription now. It takes up to about half a minute and is not repeated within 30 seconds. Admins and members can run it; auditors can read the results. Each run is kept, with who ran it, and the page shows the latest with the earlier ones listed below. Checks are run by hand; there is no schedule.

## How credentials are kept

The credentials are sealed with AES-256-GCM before they are stored, using the key in `SECRETS_ENCRYPTION_KEY` (32 random bytes in base64: `openssl rand -base64 32`). A copy of the database alone does not give them away, and a sealed value is tied to its organisation, so one organisation's cannot be opened as another's. Keep the key safe: values sealed with it cannot be read without it. Without the key, Connections cannot keep credentials and the page says so.

- The client secret is never sent back by the API, never written to the activity log, and not shown after it is entered. The list shows the tenant, client and subscription ids, which are not secret.
- Only an admin who is signed in as a person can add or remove a connection. An API key cannot.
- Removing a connection forgets its credentials. Its earlier results stay.
- Adding, checking and removing a connection are written to the activity log.

Only the three Microsoft addresses are ever called: the sign-in service, Azure Resource Manager and Microsoft Graph. Tenant, client and subscription ids must be GUIDs, so nothing else can reach the addresses that are built from them.

## In the code

- `apps/api/src/connections/`: the routes (`/v1/connections`), the service, the repositories and `providers/azure/`: the client (`azure-api.ts`), one file of checks for each area and `run-azure-checks.ts`.
- `apps/api/src/core/secrets/`: the secret box.
- `AzureConnector` is the seam for tests: the end-to-end tests replace it with a fake that answers from a table, so no test leaves the machine.
- The checks, groups and result shape are in `packages/shared/src/connections.ts`. A new check is a function in `providers/azure/checks/`, an id in that list, and its words under `connections.checks` in `apps/web/messages/en.json`. A test fails if any of them is missing.
