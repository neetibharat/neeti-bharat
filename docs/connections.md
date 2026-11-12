# Connections

A connection lets DPDP Kit read a system that holds your data and check how it is set up against what the DPDP Act expects, such as whether storage is encrypted, whether a database is open to the internet, and whether everyone has a second sign-in step. The first provider is Microsoft Azure with Entra ID. Connections are under **Connections** in the sidebar.

DPDP Kit only reads. A connection signs in with an app registration that holds read-only roles, and no check changes anything in the system.

## Setting up Azure

An admin connects a subscription with the form on the Connections page, which also shows these steps:

1. In Microsoft Entra ID, open **App registrations** and choose **New registration**. Name it `DPDP Kit` and keep it single tenant.
2. On its Overview page, copy the **Application (client) ID** and the **Directory (tenant) ID**.
3. Under **Certificates and secrets**, make a client secret and copy its value. It is shown only once.
4. On the subscription, open **Access control (IAM)** and add the **Reader** role for the app. Copy the **Subscription ID**.
5. On the app, open **API permissions**, add the Microsoft Graph **application** permissions `AuditLog.Read.All`, `Policy.Read.All` and `Directory.Read.All`, and choose **Grant admin consent**.

Without the Graph permissions the three sign-in checks are shown as not checked and the rest still run. Without the Reader role the resource checks are shown as not checked. The multi-factor report that the first check reads needs a Microsoft Entra ID P1 or P2 licence; on a tenant without one, that check is shown as not checked.

Adding a connection signs in and reads the subscription first. If Microsoft refuses the details, nothing is kept and the form says whether the sign-in failed or the subscription cannot be seen.

## What is checked

There are 51 checks in seven groups. Each is one rule about one kind of resource, read across the whole subscription: every resource group in it. A result says how many resources were looked at, how many are not fine, and names up to five of them.

| Group                         | What it looks at                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sign-in and access**        | Multi-factor sign-in registered for members (people are counted, never named) and required for everyone; two to five global administrators; no more than five Owners or User Access Administrators over the subscription; no custom role that allows every action; no app holding Owner, User Access Administrator or Contributor over the subscription |
| **Where the data is kept**    | Storage: HTTPS and TLS 1.2, no public containers, not open to every network. Encryption at rest of storage, disks and SQL databases. Key vaults: soft delete, purge protection, not open to the internet, access by Azure roles. Whether data stores are in India                                                                                       |
| **Databases**                 | SQL: TLS 1.2, public network access, firewall rules (every address fails, every Azure service warns), auditing. PostgreSQL and MySQL: encrypted connections with TLS 1.2. Public network access of PostgreSQL, MySQL, MongoDB, Redis and Cosmos DB. Cosmos DB: no key access, failover, a week of backups                                               |
| **Apps and servers**          | Web apps and function apps: HTTPS only, TLS 1.2, remote debugging off, no plain FTP, managed identity. Virtual machines: managed identity, no password sign-in on Linux, secure boot                                                                                                                                                                    |
| **Containers**                | Kubernetes: role-based access, Entra ID sign-in, network policy, a private or restricted control point, the Azure Policy add-on, auto-upgrade, monitoring. Container registries: no admin user, not public, no anonymous pulls, and for Premium registries content trust and a retention policy                                                         |
| **Network**                   | No network security group lets the internet reach SSH, remote desktop, database ports, or every port                                                                                                                                                                                                                                                    |
| **Monitoring and governance** | Production kept apart from non-production by resource group (by an `environment` tag or by name); alerts for policy, security, network and SQL firewall changes; the activity log exported; Azure Policy in use; Defender for Cloud plans on and its recommendations                                                                                    |

How each result is judged:

- **Fail** is for what should not be there: plain HTTP, old TLS, a public container, a firewall open to every address, the shared admin login of a registry, remote debugging.
- **Warn** is for what is worth a look but may be deliberate: a database open to the public network (a firewall may still keep it closed), storage open to every network (Azure's default), a vault without purge protection, a web app without a managed identity, a Defender plan that is off (each is paid).
- A check that cannot answer is shown as not checked, with the reason: nothing of that kind was found, the app is not allowed to read it, or it did not finish. One check failing never stops the others.
- Kinds a subscription does not have, such as Kubernetes clusters, show as nothing to check.

Notes on specific checks:

- The Act lets personal data go abroad unless the government restricts a country, so a data store outside India is a warning to know about, not a failure.
- Content trust and clean-up of old images are Premium features of a container registry, so smaller ones are not marked down for them.
- Customer-managed keys are not asked for: Azure encrypts at rest by default, and the Act does not require your own keys.
- The Azure Policy compliance summary is not read, because Azure only offers it as a POST, and a connection only ever sends GET requests.
- The multi-factor report needs a Microsoft Entra ID P1 or P2 licence; without one that check is shown as not checked.
- Reads of one resource at a time, such as the settings of each web app, stop at 100 resources.

## Running the checks

## Cloud tests

The results are on their own page, **Cloud tests**, with one account at a time (a selector appears when there are several; the Connections page links to the right one). It shows the totals, the checks that need attention or all of them, filters by severity (high, medium or low, a fixed judgement about each check) and a search. Findings are grouped by area. Opening one shows what it checks, when it passes and when it needs attention, why it matters, what this account showed with every resource that did not pass (up to 200), and how to fix it. The History tab lists earlier runs.

**Run checks** reads the subscription now. It takes up to about half a minute and is not repeated within 30 seconds. Admins and members can run it; auditors can read the results. Each run is kept, with who ran it. Checks are run by hand; there is no schedule.

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
