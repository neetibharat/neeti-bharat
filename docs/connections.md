# Connections

A connection lets Neeti Bharat read a system that holds your data and check how it is set up against what the DPDP Act expects, such as whether storage is encrypted, whether a database is open to the internet, and whether everyone has a second sign-in step. There are two providers: Microsoft Azure with Entra ID, and GitHub. Connections are under **Connections** in the sidebar, and their results are under **Compliance checks**.

Neeti Bharat only reads. An Azure connection signs in with an app registration that holds read-only roles, a GitHub connection with a GitHub App that holds read-only permissions, and no check changes anything in the system.

## Setting up Azure

Someone with admin rights in Azure makes the app once, and any admin of Neeti Bharat then connects it with the form on the Connections page. The form's **How to set this up in Azure** guide shows these steps, and says who can do each:

1. In Microsoft Entra ID, open **App registrations** and choose **New registration**. Name it `Neeti Bharat` and keep it single tenant.
2. On its Overview page, copy the **Application (client) ID** and the **Directory (tenant) ID**.
3. Under **Certificates and secrets**, make a client secret, note when it expires, and copy its value. It is shown only once.
4. On the subscription, open **Access control (IAM)** and add the **Reader** role for the app. This needs the Owner or User Access Administrator role on the subscription.
5. On the app, open **API permissions**, add the Microsoft Graph **application** permissions `AuditLog.Read.All`, `Policy.Read.All` and `Directory.Read.All`, and choose **Grant admin consent**. This needs a Global Administrator or Privileged Role Administrator.
6. In the form, enter the tenant ID, client ID and secret and choose **Find subscriptions**. The subscriptions the app can see are listed, and one is chosen from them, so no subscription ID is copied. A list with only one is picked for you. If it is empty, the Reader role has not been given or has not taken effect yet. Changing any of the three details clears the list and the choice.

Finding subscriptions signs in once with the details to read the list of enabled subscriptions (`POST /v1/connections/subscriptions`, admin only, never an API key). Nothing is saved and nothing is written to the activity log; the secret is used for that one sign-in.

Without the Graph permissions the three sign-in checks are shown as not checked and the rest still run. Without the Reader role the resource checks are shown as not checked. The multi-factor report that the first check reads needs a Microsoft Entra ID P1 or P2 licence; on a tenant without one, that check is shown as not checked.

Adding a connection signs in and reads the subscription first. If Microsoft refuses the details, nothing is kept and the form says whether the sign-in failed or the subscription cannot be seen.

On a GitHub connection, **Edit** changes the name, which repositories are read (all, or the ticked ones, listed from the connection's own stored key by `GET /v1/connections/:id/repositories`), and the private key. A key that is left empty is kept. The organisation cannot be changed. A new key, or a new choice of repositories, is tried with GitHub first.

## Setting up GitHub

An owner of the GitHub organisation makes a GitHub App once, and any admin of Neeti Bharat then connects it with the form on the Connections page. The form's **How to set this up in GitHub** guide shows these steps, and says who can do each:

1. In the organisation's **Settings**, open **Developer settings**, then **GitHub Apps**, then **New GitHub App**. Name it `Neeti Bharat` with the company name, give any homepage URL, and untick **Active** under Webhook.
2. Under **Repository permissions** set **Administration**, **Code scanning alerts**, **Dependabot alerts** and **Secret scanning alerts** to **Read-only**. Under **Organization permissions** set **Administration** and **Members** to **Read-only**. Everything else stays at No access.
3. Under **Where can this GitHub App be installed?** choose **Only on this account** and create the App.
4. Copy the **App ID** from the App's page. It is not the Client ID.
5. Under **Private keys** choose **Generate a private key**. A `.pem` file downloads. GitHub gives it once, and whoever has it can read what the App can read.
6. Under **Install App** install it on the organisation, on all repositories or on only some.
7. In the form, enter the App ID, paste the whole private key and choose **Find repositories**. The organisation the App is installed on is listed with the repositories it can see (`POST /v1/connections/github/discover`, admin only, never an API key; nothing is saved). One organisation is chosen for you. Then choose **All repositories**, which also takes in ones added later, or **Only selected** and tick the repositories to check. A list with nothing in it means the App is not installed yet.

Without a permission, the checks that need it are shown as not checked and the rest still run. Secret scanning, code scanning and push protection on private repositories also need the matching GitHub plan, and a repository GitHub will not answer for is left out of a check instead of passing it.

## Managing connected accounts

**Connections** lists every connected account above the catalog, ten to a page. Each row shows its name, the tenant and subscription it reads, when it was last checked and how many checks passed, needed a look or failed, and a link to its results. An admin also gets an edit and a remove button on each row; the edit button is on the Cloud checks page as well, next to the account.

**Edit** changes the name, the tenant ID, the client ID and the client secret. A secret that is left empty is kept, so the usual job is to enter a new secret before the old one expires. The subscription cannot be changed, because another subscription is another connection. A new name is saved at once. New details are tried with Azure first, as when adding, and if Azure refuses them nothing changes and the form says whether the sign-in failed or the subscription cannot be seen.

## What is checked on Azure

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

## What is checked on GitHub

There are 6 checks in 3 groups. The two about the organisation run once, and the four about repositories run on every repository in scope (the ones picked, or all of them, up to 100 and without archived ones). A result names how many repositories were looked at and how many are not fine, and lists them.

| Group                        | What it looks at                                                                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sign-in and access**       | Two-factor sign-in is on for every member (people are counted, never named); two to five owners                                                                              |
| **Code review and scanning** | A review is required before changes reach the default branch, by a branch protection rule or a ruleset; code scanning is set up, by the default setup or by uploaded results |
| **Secrets and dependencies** | Secret scanning and push protection are on; Dependabot alerts are on                                                                                                         |

- **Fail** is for no rule on the default branch, secret scanning off, or Dependabot alerts off. **Warn** is for a rule that needs no approval, push protection off, no code scanning, or an owner count outside two to five.
- A repository the App may not read for a check, such as one on a plan without the feature, is left out of that check. When that is every repository, the check is shown as not checked, with the reason.
- The two-factor check needs the App to see members without it, which GitHub offers to owners. When GitHub does not allow it, that check is shown as not checked.
- On a personal account, which has no members, the two organisation checks have nothing to check.

## Cloud checks

The results are on their own page, **Cloud checks** (under **Compliance checks** in the Data area, beside Website checks), with one connection at a time, Azure or GitHub (a selector lists up to 100 accounts when there are several; the Connections page links to the right one). **Run checks** always runs the account that is selected, so each account is run on its own. It shows the totals, the checks that need attention or all of them, filters by severity (high, medium or low, a fixed judgement about each check) and a search. Findings are grouped by area. Opening one shows what it checks, when it passes and when it needs attention, why it matters, what this account showed with every resource that did not pass (up to 200), and how to fix it. The History tab lists earlier runs.

Each resource that did not pass shows what the check saw on it:

- its region and, on Azure, its resource group;
- an **Open** link to its page in the Azure portal, or to the repository's settings page on GitHub (for a Defender recommendation, the recommendation's own page);
- the settings that decided the result, under the system's own names, such as `minimalTlsVersion 1.0` or `required_approving_review_count 0`. A setting the system does not report is shown as not set.

Checks that count people, such as multi-factor registration, name no one and show only the count. The cloud report kept on proofs lists the same settings beside each resource.

**Run checks** reads the subscription now. It takes up to about half a minute and is not repeated within 30 seconds. Admins and members can run it; auditors can read the results. Each run is kept, with who ran it.

### Choosing what is checked

Beside the schedule, **What is checked** says how many groups the account runs, such as **All 7 groups**. An admin can open it and untick a group the account does not use, such as containers. At least one group stays on.

- Checks in a group that is off do not run, whether by **Run checks**, by the schedule or on their own, and are not in new results. Earlier runs keep what they found.
- A proof that relies on a check that is off cannot be backed by this account while it is off, because nothing shows that the check holds.
- Others see which groups are not checked. Only an admin who is signed in as a person can change it, and the change is written to the activity log.
- The API takes it as `PUT /v1/connections/{id}/groups` with `{ "groupsOff": [...] }`, using the group ids in `CHECK_GROUPS`.

### Running some checks again

After fixing something, there is no need to read everything again:

- **Run this check again**, at the foot of an open finding, reads that one check.
- **Run these checks again**, beside each group, reads the checks the group shows under the current filters.

Either one makes a new run that reads only those checks. Every other check is kept as the last run found it, so the latest run always has every check. A kept result says it is from an earlier run and when it was read. The summary and the history say how many checks the run read again.

- The API takes the list as `POST /v1/connections/{id}/run` with `{ "checks": [...] }`. Without a body it runs everything. Each check must belong to that system. Naming every check is the same as a full run.
- The 30-second gap applies the same way, and the activity log names the run as checks run again.
- The schedule counts only full runs, so running a few checks again never puts off the next full one.
- A proof note made from such a run is dated by the oldest reading behind it, so a kept result is never presented as new.

### Automatic checks

Beside the account, an admin can set **Check automatically** to **Off**, **Every day** or **Every week**. It starts off. The API looks once an hour for connections that are due and checks each one the same way the button does. A check is due when a day (or a week) has passed since the last check or the last try, counted an hour short so the hourly look does not make it an hour late. A full run pressed by hand counts, so a connection checked this morning is not checked again by the schedule the same day.

- A scheduled run is kept like any other, marked **Automatic** in the history, and written to the activity log as **Scheduled check**. Changing the schedule is written to the activity log too.
- When the sign-in fails, for example because a client secret expired, nothing is kept as a run. The connection is marked, the Cloud checks page shows that the last automatic check could not sign in, and the activity log has an entry. The schedule tries again when the next check is due, and the mark goes away when one works.
- Each try is claimed in the database before it is made, so a restart, or more than one copy of the API, never checks the same connection twice. The schedule does not run in tests.
- Anyone who can see the page is told when a schedule is on. Only an admin who is signed in as a person can change it; an API key cannot.

## Proof from checks

Some proofs are about how a system is set up, and a run of the checks can show that. Three are listed, and only these:

| Proof                                      | Azure checks behind it                                                                            | GitHub checks behind it                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- | -------------------------------------- |
| RC02 – User list, roles and MFA status     | Multi-factor sign-in registered and required                                                      | Two-factor sign-in on for every member |
| RC04 – Privileged (admin) access list      | Global administrator count, privileged roles, wildcard roles, app registrations with broad roles  | Owner count                            |
| RQ04 – Encryption, masking or tokenisation | Storage secure transfer, encryption at rest, SQL TLS, PostgreSQL and MySQL TLS, web apps on HTTPS | None                                   |

When a run holds up for a proof, the run leaves a dated note on that proof, named **Cloud checks: {connection name}** and added by **Automatic check**. It lists each check behind the proof and says it passed, so an auditor can see what was true on that date. It counts like any other proof, so the proof's own frequency decides when it is due again. Nothing else changes: a run never removes or edits proof, and policies, training and the other proofs are still done by people.

A run holds up for a proof when every check behind it for that system passed, or found nothing of its kind to look at, or was accepted (below), and at least one of them found something to pass. A check that failed, warned without being accepted, or could not answer (the connection may not read it) keeps the note from being made. A connection leaves at most one note on a proof in seven days, so a daily schedule does not bury it. A run of GitHub backs up only the proofs that list GitHub checks, and a run of Azure only the ones that list Azure checks.

### Accepting something as deliberate

A check can flag something that is deliberate, such as a database that is open to the public network behind a firewall. On the Cloud checks page, each resource a check lists has an **Accept** button, and a check that names no resources has one for the check as a whole. It asks why, up to 500 characters. The check still shows the resource, marked as accepted with the reason and who said so, and **Take back** undoes it. An accepted resource no longer keeps a proof from being backed. Accepting counts from the next run, and changes no earlier note.

- Admins and members can accept and take back; auditors can read. Accepting and taking back are written to the activity log.
- An acceptance belongs to one connection, one check and one resource name, so a new resource that fails is not accepted by an old decision. Accepting the same thing again replaces the reason.
- A list of resources that was cut short (a result keeps 200) is never taken as all accepted.

## How credentials are kept

The credentials are sealed with AES-256-GCM before they are stored, using the key in `SECRETS_ENCRYPTION_KEY` (32 random bytes in base64: `openssl rand -base64 32`). A copy of the database alone does not give them away, and a sealed value is tied to its organisation, so one organisation's cannot be opened as another's. Keep the key safe: values sealed with it cannot be read without it. Without the key, Connections cannot keep credentials and the page says so.

- The client secret and the GitHub private key are never sent back by the API, never written to the activity log, and not shown after they are entered. The list shows the tenant, client and subscription ids, or the App ID, installation ID, organisation and chosen repositories, which are not secret.
- Only an admin who is signed in as a person can add, change or remove a connection. An API key cannot.
- Removing a connection forgets its credentials. Its earlier results stay.
- Adding, changing, checking and removing a connection are written to the activity log. A change is logged with the name, never the secret.

Only these addresses are ever called: for Azure, the Microsoft sign-in service, Azure Resource Manager and Microsoft Graph; for GitHub, `api.github.com`. Tenant, client and subscription ids must be GUIDs, and a GitHub App ID and installation ID must be numbers, so nothing else can reach the addresses that are built from them. A next page of a GitHub list is followed only when its link stays on `api.github.com`. The only request that is not a GET is the one that trades the App's signed message for a short-lived token, which lasts about an hour and is made again for each run.

## In the code

- `apps/api/src/connections/`: the routes (`/v1/connections`), the services, the repositories and `providers/`. Each provider has a client (`azure/azure-api.ts`, `github/github-api.ts`), its checks and a driver that gives the service one way to try the details and to read the system. `azure/` has one file of checks for each area; `github/checks/` has the organisation checks and the repository checks.
- `connections/services/connection-scheduler.ts` is the hourly timer and `connection-schedule.service.ts` decides which connections are due and checks them. `ConnectionRepository.claimAttempt` is the claim.
- `packages/shared/src/proof-checks.ts` lists which proofs each system's checks back up (`PROOF_CHECKS`). `connections/utils/proof-snapshot.ts` decides whether a run backs a proof and writes the note, and `frameworks/services/proof-snapshot.service.ts` attaches it. `connection-run.service.ts` saves a run, its log entry and the notes together. To back a new proof, add it to `PROOF_CHECKS`; a test checks that the proof and the checks exist.
- `apps/api/src/core/secrets/`: the secret box.
- `AzureConnector` and `GithubConnector` are the seams for tests: the end-to-end tests replace them with fakes that answer from a table, so no test leaves the machine.
- `providers/outcome.ts` judges a list of resources and keeps, for each that did not pass, what the check describes: its name, region, resource group, link and the settings it read. An Azure check that is one rule about one kind of resource is written with `rule()` in `azure/checks/rules.ts`, which takes the verdict and the settings to show.
- `connections/utils/carry-over.ts` keeps the results a run of only some checks did not read again.
- The checks, groups and result shape are in `packages/shared/src/connections.ts`. A new check is a function in the provider's `checks/` folder, an id in that provider's list, and its words under `connections.checks` in `apps/web/messages/en.json`. A test fails if any of them is missing.
