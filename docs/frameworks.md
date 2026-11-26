# Frameworks

The DPDP checklist: what the law asks of a company, broken into jobs people can own and finish.

## The three things

- **Rule.** A part of the DPDP Rules, for example "Rule 7: report a data breach". There are 13, plus a group for controls that support every rule.
- **Control.** One job that follows from a rule, for example "Have a written breach process". There are 47.
- **Policy.** A document that covers one or more controls. The catalogue has 18, and a company can add its own. Each names an owner job, an approver, and the proof a company keeps to show it is followed.

A control can be covered by several policies, and a policy covers several controls. The link is stored once, on the control (`policyIds`). The policy's list of controls is worked out from it, so the two can never disagree.

## Screens

Three layers, each one click deeper:

1. **Frameworks** (`/frameworks`): the frameworks you follow, each with its readiness, read from the database. DPDP is built in, and a company can add its own. ISO 27001 and SOC 2 are not built: nothing for them is listed in the product.
2. **A framework** (`/frameworks/dpdp`, or `/frameworks/<id>` for any other): a summary of the whole framework, then every rule with its readiness, number of controls, policies and status. The set-up tab belongs to DPDP only, because its answers switch DPDP's rules on and off.
3. **A rule** (`/frameworks/dpdp/rules/R6`): click a rule to open its own page. It shows how far the rule is on the three things it needs side by side (controls done, policies approved, proof in), then three tabs: **Controls**, **Policies** and **Proof**. The page loads from one request, `GET /v1/frameworks/:id/rules/:ruleId`, which returns the rule with its controls and only the policies that cover them. The page is for seeing what a rule needs and what is missing. The work is done on the pages it links to: a policy page to write or approve, a proof requirement page to collect proof. A rule that does not apply to the company is dimmed on the list and cannot be opened. Auditors see everything but cannot change it.

A rule's status comes from its controls: done when all are done, in progress once any has moved, otherwise not started.

## Your own frameworks

A company can follow more than the built-in framework: a customer's security review, an internal standard, another law. **Add framework** on the Frameworks page asks for a name, one sentence on what it is and a short badge, then opens it.

- **Rules.** On a framework, **Add rule** adds a rule with a reference (such as `4.2`), a title and what it asks. Each rule has its own page, with the same Controls, Policies and Proof tabs as a DPDP rule, and a pencil and archive for the rule itself.
- **Controls.** "Add control" on a rule works as it does for DPDP, and the control belongs to that rule's framework. Policies are company-wide, so one policy can back controls in several frameworks, and a policy's page lists all of them.
- **Built-in can change.** DPDP and its rules can be renamed, edited, added to and archived like any other, because `BUILT_IN_LOCKED` in `packages/shared` is `false`. Set it to `true` and they are closed (`BUILT_IN`); controls, policies and proof stay open either way. The catalogue only adds rows a company does not have, so an edited or archived built-in rule is not put back on restart.
- **Archiving.** A rule or framework can only be archived once its controls are archived, so nothing is left hidden.
- **Activity log.** `FRAMEWORK_CREATED`, `FRAMEWORK_EDITED`, `FRAMEWORK_ARCHIVED`, `REQUIREMENT_CREATED`, `REQUIREMENT_EDITED`, `REQUIREMENT_ARCHIVED`.
- **Limits.** A custom rule is always on (no set-up answer switches it off), there is no "restore" for an archived framework or rule, and the Your set-up tab is DPDP's only.

## Policies

`/policies` lists the policies (the 19 built-in ones and any the company added), and a policy page (`/policies/P05`) shows its owner, approver, status, text, the proof to keep (what the controls it covers need proof of, with where each stands, from the same list as the Proof page), and the controls it covers. Each covered control links to its rule in Frameworks (`/frameworks/dpdp/rules/R6` is that rule's page, built from the framework id and the rule id; `/frameworks/dpdp?rule=R6` redirects to it), and each control in Frameworks links back to its policies.

A built-in policy starts with the text in `packages/shared/src/frameworks/dpdp/policy-texts/`, one Markdown file per policy, until someone edits it. `{{key}}` in it is a company answer, filled in when the text is shown. A policy the company adds starts with a short text built from its summary and the controls it covers.

### Your own policies

Admins and members can add, edit and archive policies. Auditors can only read.

- **Add.** "Add policy" asks for a title, what the policy is for, the owner job, the approver’s title and the framework it is filed under. It is created as a draft with a generated id, marked Custom, and its page opens so the text can be written. Where [AI help](ai-help.md) is set up, the dialog can instead start from a PDF, Word or PowerPoint file, which fills in the details and the text for the person to check. It starts from the same starting text as any policy, and goes through the same approval.
- **Edit details.** "Edit details" on a policy changes its title, summary, owner job and approver title. The text, the named approver and the status keep their own controls, so a change to details never rewrites approved text.
- **Cover controls.** A control picks its policies in its own edit dialog, and a policy of the company’s own is in that list like any other.
- **Archive and restore.** An archived policy stops counting: it leaves the list and the controls it covered no longer wait on it. It is kept and listed under "Archived policies" so it can be restored.

Every change is written to the activity log: `POLICY_CREATED`, `POLICY_DETAILS_EDITED`, `POLICY_ARCHIVED`, `POLICY_RESTORED`.

### The text

A policy's text is a rich-text document, edited with [Tiptap](https://tiptap.dev) (built on ProseMirror). The API stores the editor's JSON and does not look inside it beyond checking its shape and size.

- **Starting text.** Until someone edits a policy, its text is built from what the policy already says: the purpose is its summary, the requirements are the controls it covers, and a few settings are quoted from the company profile.
- **Company answers.** A company answer is written as `{{key}}` in the text. Readers see it filled in from the profile, so one change in Company profile updates every policy that uses it. An answer that is not filled in yet is shown in orange with its name in square brackets. While editing, the tokens are visible, Typing `{{` in the text, or "Insert company answer" in the toolbar, opens a list of the answers to choose from, narrowed as you type. An answer the company added under Company profile (key `custom:` and a name, such as `custom:office-address`) is in the list and is filled in the same way.
- **Editing.** Only a draft can be edited. To change an in-review or approved policy, send it back or reopen it first.

### Approval and versions

- **Draft to in review.** Anyone who can edit asks for approval, and can add a note on what changed.
- **In review to approved, or back to draft.** This is for the **named approver**. If nobody is named, any admin can decide. If a person is named, only that person can, even over an admin, so an admin who wants to approve must first change the approver, and that change is logged.
- **Versions.** Each approval keeps the text it approved as the next numbered version, with who approved it, when, and the note on what changed. Old versions can be opened and read, and are never changed.
- **Review date.** An approved policy is due for review a year after approval.

Anyone with a login can read policies. Auditors cannot change anything.

## Where things live

Two layers, as in most compliance tools:

| Layer     | Where                                                                                                   | What                                                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Catalogue | `packages/shared/src/frameworks/dpdp/`                                                                  | The framework as shipped: rules, control templates, policy templates and the text each policy starts with (`policy-texts/`, Markdown). Typed data in code, so a correction ships with a release. |
| Company   | `frameworks`, `requirements`, `controls`, `policies`, `control_policy_links`, `policy_approvals` tables | The company's own copy. Controls and policies are copied from the catalogue the first time the API starts, then belong to the company.                                                           |

A **framework** is a set of rules a company follows. DPDP is the built-in one, stored in `frameworks` like any other, and a company can add its own. Policies belong to the company rather than to a framework, so one policy can back controls in several.

A **requirement** is one rule of a framework ("Rule 6 · Security safeguards"). The 13 DPDP rules and the organisation-wide group are rows in `requirements`, copied from the catalogue on API start like everything else (no migration inserts them), so every control points at a rule through a real foreign key. This is what lets a company add rules of its own.

The copy is what makes the checklist controllable: the company can change its own text and owners, and add or archive items, without touching the catalogue.

- **Seeding.** `FrameworkSeedService` runs on every start. It adds anything missing and never overwrites a row that is already there, so the company's edits survive upgrades. A link between a control and a policy is only added when one of them is new, so a link the company removed does not come back.
- **Ids.** A built-in rule, control or policy keeps its catalogue code as its id (`R6`, `DPDP-R6-01`, `P08`). One the company adds gets a generated id. `templateId` records where a row came from, and is empty for the company's own.
- **Order.** `sortOrder` keeps the catalogue's order. A link's `position` says which policy is primary: 0 is the primary one, and its owner is the control's default owner.
- **Who holds a job.** A control's owner is a job such as the DPO. The person is whoever holds it in People and roles.

## Changing your own controls

Admins and members can change the company's copy of a control. Auditors can only read.

- **Edit.** The pencil on a control changes its title, what it asks, the person on it, a review date, and which policies cover it. The first policy is the primary one, and its owner is the control's default owner, so a policy added later goes last.
- **Add.** "Add control" under a rule creates a control of the company's own. It is marked Custom and gets a generated id.
- **Archive and restore.** An archived control stops counting and disappears from its rule and from the policies it was listed on. It is kept, and listed under "Archived controls" so it can be restored.
- **Person.** A control can name a person on top of the job's owner. Only people who still work here can be chosen.

Every change is written to the activity log: `CONTROL_CREATED`, `CONTROL_EDITED`, `CONTROL_ASSIGNED`, `CONTROL_ARCHIVED`, `CONTROL_RESTORED`. A request that changes nothing records nothing.

## Proof

A control lists what it needs **proof** of, and proof is attached to each of those. Both belong to the company, like controls and policies.

- **Requirements.** Each control starts with the proof a company would typically keep for it (39 in the DPDP catalogue, in `packages/shared/src/frameworks/dpdp/proof-requirements.ts`), copied into the database on API start. A requirement has a title, a description and a **frequency**. A web address (`http` or `https`) in the description is shown as a link that opens in a new tab, so a company can point to a template kept in its own Google Drive, SharePoint or wiki. A path such as `/templates/PR-P01-01-published-notice-snapshot.docx` is shown as a download of that file, which the app serves from `apps/web/public/templates/`. Templates are never required: they help a company that wants a form to fill in, and anyone can upload their own proof instead. In the form for a requirement, typing `/` at the start of a word in the description lists every template the kit ships, narrowed as more is typed, and choosing one writes its path. A link to the company's own template can be pasted as it is. To add a template, put the file in that folder, named after the proof id, list it in `PROOF_TEMPLATES` in `packages/shared/src/frameworks/dpdp/proof-templates.ts`, and give the catalogue row `templateNote(file)` as its description. A test checks that each listed file exists and is named by its proof. The frequency is only once, monthly, quarterly or yearly. Companies add, edit and archive their own; seeding never overwrites an edit and never brings back an archived one.
- **Proof** is a **link** (a scan, a document, a ticket), a **note**, or a **file**, given against a requirement. Links must be `http` or `https`, and open in a new tab. Proof on a control that is not for any requirement shows as "Other proof". Auditors read and download but cannot change.
- **Files** are kept in the company's own S3-compatible storage (see [Storage](self-hosting.md#8-storage-for-proof-files-optional)). A file can be a PDF, PNG, JPG, WebP, GIF, text, CSV, Word, Excel, PowerPoint or ZIP file, up to 25 MB. The API reads the contents of every upload and refuses one that is not what its extension says, so a renamed program is turned back. The stored name has folders and control characters removed and is at most 120 characters. The object is private. A download is a link that lasts 5 minutes (`GET /v1/controls/:id/evidence/:evidenceId/download`), saved under the original name. The SHA-256 of the contents is stored with the proof. Removing the proof removes the file. Without storage the drop-zone says so and links and notes still work.
- **Who and when.** A requirement can name the person who collects it (otherwise the control's owner does) and a **first due date**. Once proof is given, the frequency sets the next date. A requirement whose date has passed without fresh proof is **overdue**, shown in red.
- **Freshness.** A requirement is **missing** until proof is given, **provided** while the latest proof is inside its window, and **due again** once it is not: monthly 31 days, quarterly 92, yearly 366. "Only once" never goes stale.
- **Proof page** (`/proof`). Every control that needs proof, 25 to a page, each with how many of its requirements are provided and how many are overdue, due again or missing. A control opens in place to its requirements. The figures above the list count requirements, the tabs (overdue, missing, due again, provided) count controls, and there is a search and filters for the person and the rule. A search or filter opens every control. Search, filters, counts and paging are done by the API (`GET /v1/proof/by-control`). A requirement title opens that requirement's own page, and "Open control" opens the control's own page. /proof?control=<id>` is that control's own page: its name as the title, a link back to all proof, **Add proof requirement** in the header, the four counts for that control, and three tabs: **Requirements** (its requirements, paged), **Other proof** (proof that is not for any requirement, with the drop zone) and **Archived** (requirements that were archived, which can be restored; the tab is shown only when there are some).
- **Requirement page** (`/proof/:id`). An Overview tab with its status, assignee, frequency and due date (each saves as it is changed), the proof given, and a file drop-zone (switched off, with a note, while storage is not set up). A Mappings tab shows the control it is for and that control's policies. A control's proof link opens the Evidence page narrowed to that control.
- **Files** are not supported. They need storage first: an S3-compatible bucket, uploaded through the API and read through short-lived signed links.

Changes are written to the activity log: `EVIDENCE_ADDED`, `EVIDENCE_REMOVED`, `PROOF_REQUIREMENT_ADDED`, `PROOF_REQUIREMENT_EDITED`, `PROOF_REQUIREMENT_ARCHIVED`, `PROOF_REQUIREMENT_RESTORED`.

## How a control gets its status

Nobody picks a control's status. It is worked out from what the control already has:

| Status          | When                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Done**        | Every policy that covers it is approved, **and** all its proof is in and fresh (or, with no requirements, there is any proof). |
| **In progress** | Something is in place but not everything.                                                                                      |
| **Not started** | No policy has moved past draft and no proof is in.                                                                             |

A control that no policy covers needs only proof. A rule's progress and the framework's percentage count done controls, and a rule that does not apply to the company is left out.

Each control shows what is missing, in orange: "1 of 2 policies approved" and "2 of 3 proof in". Reopening a policy, or proof going stale, sends the control back, because the status is recalculated every time and never stored.

Status is calculated rather than chosen so it cannot be ticked without the work behind it. A proof requirement has a frequency and goes stale on its own, and nobody sets its status by hand: it is missing, provided or due again according to when proof was last given.

## Dashboard and My work

The **Dashboard** (`/`) shows where the company stands: a readiness gauge across all frameworks with the policies approved and proof in, what needs attention (open breaches first, then late proof, reviews and [requests](requests.md), policies waiting on a decision, requests due within a week, reviews coming up), each framework's progress, and the first few things waiting on the signed-in person. Admins also see who carries the most open work and the latest changes from the activity log.

**My work** (`/my-work`) lists everything waiting on one person, most urgent first, in sections: overdue, due in the next 7 days, due later, and waiting with no date. Six figures sit on top, and tabs split it by kind. It is worked out from who they are in People and roles, so nobody has to assign "tasks" separately. Admins can choose another person to see how work is split (`GET /v1/my-work/of/:personId`).

- **Breach.** An open [breach](breaches.md) that names an assignee, for that person only. One that names nobody, for whoever holds the DPO job and for admins. It is dated by the Board report deadline until the Board is told, and is overdue once that deadline passes. Open breaches come before other work.
- **Request.** An open [request](requests.md) from a person that names an assignee, for that person only. One that names nobody, for whoever holds the DPO job and for admins. It is dated by its due date and is overdue once that date passes. It comes after breaches and before approvals.
- **Proof to collect.** A requirement that names them, or that names nobody on a control they own. A control is theirs when it names them, or names nobody and they hold its owner job. Proof that is provided and still fresh drops off.
- **Approve.** A policy in review whose named approver is them, or, when no approver is named, any admin.
- **Review.** An approved policy they own whose yearly review is within 30 days or late.
- **Write.** A draft policy owned by a job they hold.

Order: overdue first, then approvals, reviews, proof and drafts, the earliest date first within each. Auditors have no owned work, so theirs is empty.

## Who owns what

Ownership flows down and is only set where it differs. A policy has an owner job and an approver. A control's owner job starts as its main policy's owner, and can be changed (with an optional named person) in the control's edit dialog. A proof requirement is collected by the control's owner unless it names someone. The control row shows the result, not a picker. A breach or a request has no job behind it: it names a person, and while it names nobody it is the DPO's (and every admin's) in My work.

## Defaults

- A control is **not started** until a policy moves past draft or proof is added.
- Its owner is the owner of its primary policy. Organisation-wide controls go to the DPO.
- Choosing the default owner stores nothing, so a later change to the default still reaches that control.

## API

| Request                                                | Who                    | What                                                                                                                                                                                                   |
| ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /v1/frameworks`                                   | admin, member, auditor | The frameworks, each with how far along it is.                                                                                                                                                         |
| `GET /v1/frameworks/:id`                               | admin, member, auditor | One framework: every rule with its controls, status and owner.                                                                                                                                         |
| `GET /v1/frameworks/:id/rules/:ruleId`                 | admin, member, auditor | One rule with its controls, and only the policies that cover them. A rule that is archived or in another framework is `NOT_FOUND`.                                                                     |
| `POST /v1/frameworks`, `PUT /v1/frameworks/:id`        | admin, member          | Add or change a framework of your own. `POST :id/archive` archives it.                                                                                                                                 |
| `POST /v1/frameworks/:id/requirements`                 | admin, member          | Add a rule. `PUT /v1/requirements/:id` and `POST .../archive` change it.                                                                                                                               |
| `POST /v1/controls`                                    | admin, member          | Add a control under a rule. It joins the rule's framework.                                                                                                                                             |
| `PUT /v1/controls/:id/details`                         | admin, member          | Edit title, text, owner job, person, review date and policies, in one save.                                                                                                                            |
| `POST /v1/controls/:id/archive`                        | admin, member          | Archive a control. `/restore` brings it back.                                                                                                                                                          |
| `GET /v1/assignees`                                    | admin, member          | The people work can be given to.                                                                                                                                                                       |
| `GET /v1/policies`                                     | admin, member, auditor | Every policy with its standing: only what the list shows.                                                                                                                                              |
| `GET /v1/policies/archived`                            | admin, member, auditor | Policies that were archived.                                                                                                                                                                           |
| `POST /v1/policies`                                    | admin, member          | Add a policy of your own, as a draft, under a framework.                                                                                                                                               |
| `PUT /v1/policies/:id/details`                         | admin, member          | Edit a policy’s title, summary, owner job and approver title.                                                                                                                                          |
| `POST /v1/policies/:id/archive`                        | admin, member          | Archive a policy. `/restore` brings it back.                                                                                                                                                           |
| `GET /v1/policies/:id`                                 | admin, member, auditor | One policy with its text, history and whether you may decide.                                                                                                                                          |
| `GET /v1/policies/:id/coverage`                        | admin, member, auditor | Every control a policy covers, across all frameworks.                                                                                                                                                  |
| `GET /v1/policies/:id/versions/:n`                     | admin, member, auditor | The text of one approved version.                                                                                                                                                                      |
| `PUT /v1/policies/:id/content`                         | admin, member          | Save the text. Drafts only.                                                                                                                                                                            |
| `PUT /v1/policies/:id/status`                          | admin, member          | Ask for approval, or approve, send back or reopen. A move someone else already made is refused with `CONFLICT`.                                                                                        |
| `PUT /v1/policies/:id/approver`                        | admin                  | Name the person who must approve.                                                                                                                                                                      |
| `GET /v1/my-work`                                      | admin, member, auditor | What is waiting on the signed-in person.                                                                                                                                                               |
| `GET /v1/my-work/team`, `GET /v1/my-work/of/:personId` | admin                  | How much is waiting on each person, and one person's work.                                                                                                                                             |
| `GET /v1/proof`                                        | admin, member, auditor | One page of what needs proof. Narrow it with `tab`, `q`, `assigneeId`, `ruleId`, `controlId`; page with `page` and `limit`. It also returns the count for each tab.                                    |
| `GET /v1/proof/by-control`                             | admin, member, auditor | One page of controls, each with its requirements. Narrow it with `tab`, `q`, `assigneeId`, `ruleId`; page with `page` and `limit`. It returns the count for each tab, in requirements and in controls. |
| `GET /v1/proof/:id`                                    | admin, member, auditor | One proof requirement with its proof and the control it is for.                                                                                                                                        |
| `GET/POST /v1/controls/:id/evidence`                   | admin, member (write)  | A control's archived requirements and loose proof, or add a link or note. `DELETE .../evidence/:evidenceId` removes it.                                                                                |
| `POST /v1/controls/:id/evidence/files`                 | admin, member          | Attach a file: a multipart form with `file`, and optional `title` and `proofRequirementId`.                                                                                                            |
| `GET /v1/controls/:id/evidence/:evidenceId/download`   | admin, member, auditor | A `{ url, expiresAt }` for a proof file. The link works for 5 minutes.                                                                                                                                 |
| `GET /v1/storage`                                      | all roles              | Whether uploads are set up, the size limit and the accepted types.                                                                                                                                     |
| `POST /v1/controls/:id/proof-requirements`             | admin, member          | Add a requirement. `PUT`/`DELETE /v1/proof-requirements/:id` edit or archive, `POST .../restore` brings it back.                                                                                       |

Each change is written to the [activity log](activity-log.md), in the same database transaction as the change itself. A control's status is calculated, so no event is written for it.

Lists send only what their screen shows, and long ones are paged (`page`, `limit`). Policies, proof and controls are company-wide, so they live under their own paths; only frameworks and their rules sit under `/v1/frameworks`.

## Not decided yet

- **Which rules apply to a company.** Each rule says what switches it on (`appliesWhen`: always, children's data, data abroad, significant data fiduciary). The company answers that decide it come with the set-up wizard.
- **Proof reminders.** A person who collects proof is told when it is due soon or late. See [notifications.md](notifications.md).
- **ISO 27001 and SOC 2.** Not decided yet, and not shown in the product. The mapping needs legal review.

## Review

The rules, controls and policies have not been reviewed by counsel, and six rule summaries were written to match the others. Treat all of it as suggested until it is reviewed.
