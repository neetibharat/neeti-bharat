# Exports

The Exports page (`/exports`) takes the company's records out of the app: everything in one zip for an auditor, one rule's evidence in a zip, or one list at a time as a spreadsheet. Admins, members and auditors can all download. Every download is written to the [activity log](activity-log.md) as `DATA_EXPORTED`, naming what was taken and who took it.

## Audit pack

`GET /v1/exports/audit-pack` returns one zip, built as it is sent, so the pack is never held whole in memory. It holds:

| Entry                    | What it is                                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `checklist.csv`          | Every control of every framework: status, owner, assignee, policies approved, proof provided                                  |
| `proof-requirements.csv` | What each control must prove, how often, who collects it, when it is due and when proof was last given                        |
| `proof.csv`              | Every piece of proof: files, links and notes, with who added it, when, the file's SHA-256 and where the file sits in the pack |
| `policies.csv`           | Each policy with its status, approver and approved version, and where its text sits in the pack                               |
| `breaches.csv`           | Each breach with the date of every step and the notes saved with them                                                         |
| `requests.csv`           | Each request with its due date, identity check, the systems handled with their outcome, and the reply                         |
| `people.csv`             | Everyone on record, the jobs they hold and their access                                                                       |
| `activity-log.csv`       | Every event, oldest first, with each event's hash and the hash before it                                                      |
| `policies/`              | The newest approved text of each policy as Markdown. A policy that was never approved has no file                             |
| `proof/<control id>/`    | Every file uploaded as proof, each named `<last 8 of its id>-<original name>`                                                 |
| `integrity.txt`          | The result of the activity log's integrity check, run when the pack is made                                                   |
| `README.txt`             | The date, who made the pack, what is in it, and any problems                                                                  |

A file that cannot be read from storage, or whose SHA-256 differs from the one saved when it was uploaded, does not stop the pack. It is listed under "Problems" in `README.txt`, and a file that cannot be read is left out of `proof/`.

## Evidence packs

`GET /v1/exports/evidence-pack/:frameworkId/:ruleId` returns one zip for a single rule, for an auditor or the Board. It is built as it is sent, like the audit pack, and a rule that does not exist is `NOT_FOUND` (404). It holds:

| Entry                    | What it is                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `README.txt`             | What the rule asks, whether it applies, where each control stands, what is in the pack, and any problems                        |
| `controls.csv`           | The rule's controls: status, owner, who holds the job now, assignee, review date, the policies behind each, and proof provided  |
| `proof-requirements.csv` | What each of those controls must prove, how often, who collects it, when it is due and when proof was last given                |
| `proof.csv`              | Every piece of proof on those controls, with the file's SHA-256 and where the file sits in the pack                             |
| `policies.csv`           | The policies that cover those controls, with their status, approver and approved version, and where their text sits in the pack |
| `activity-log.csv`       | The events about the rule, its controls and those policies, oldest first, each with its hash and the hash before it             |
| `policies/`              | The newest approved text of each of those policies as Markdown. A policy that was never approved has no file                    |
| `proof/<control id>/`    | Every file uploaded as proof on those controls                                                                                  |
| `integrity.txt`          | The result of checking the whole activity log, run when the pack is made                                                        |

The activity log in a pack is only the events about this rule, so its rows are not a continuous chain; each keeps its own hash and the hash before it, so it can be matched against the full log in the audit pack. Unreadable or changed proof files are handled as in the audit pack: listed under "Problems" in `README.txt`, and a file that cannot be read is left out.

A pack is written to the activity log as `DATA_EXPORTED`, naming the rule ("the evidence pack for Rule 6, Security safeguards"). Admins, members and auditors can download one.

The Exports page lists every rule of every framework with a **Download pack** button, and each rule page has an **Evidence pack** button. A rule that does not apply to the company can still be downloaded; the list marks it.

## Lists

`GET /v1/exports/csv/:dataset` returns one list as a CSV. `dataset` is one of `checklist`, `proof_requirements`, `evidence`, `policies`, `breaches`, `requests`, `people`, `activity` (`EXPORT_DATASETS` in `packages/shared`); any other value is `NOT_FOUND` (404). Each list is the whole table, not a page, and the same columns as in the pack, except that `proof.csv` and `policies.csv` have no column for a place in a pack.

CSV files are written for Excel: UTF-8 with a byte order mark, CRLF line ends, dates as ISO 8601 in UTC. A cell that starts with `=`, `+`, `-`, `@`, a tab or a carriage return is saved with a leading `'`, so text typed by a person is never run as a formula.

The activity log list is read in batches of 1,000 events.

### Cutting a list to a range of days

`GET /v1/exports/csv/:dataset?from=YYYY-MM-DD&to=YYYY-MM-DD` cuts the lists that have a date to read it against; either end may be left out, and both days are included. Days are read in UTC.

| List                  | The range reads                  |
| --------------------- | -------------------------------- |
| `evidence` (Proof)    | The day the proof was added      |
| `breaches`            | The day the breach was found     |
| `requests`            | The day the request was received |
| `activity` (Activity) | The day the event was logged     |

The other lists show how things stand today, so a range is ignored for them. A day that does not exist (`2026-02-30`) or an end before the start is refused with `VALIDATION_FAILED` (400). The activity log entry for the download names the range ("Downloaded the breaches register from 2026-04-01 to 2026-06-30"). The audit pack is always whole.

## In the web app

The page has the audit pack at the top, then two tabs: **Evidence packs** (one download for each rule) and **Lists**. On Lists, one Date range field takes typed dates or a calendar, with shortcuts beside it for Last 30 days, This financial year and Last financial year (1 April to 31 March); each list says whether the range applies to it. The end cannot be set before the start. The field is the shared `DateRangePicker` in `components/base/date-range-picker/`, which any page can use.

Each download button fetches the file with the signed-in session and hands it to the browser to save, under the name the API sends in `Content-Disposition`. A failed download shows its error under the button.
