# Exports

The Exports page (`/exports`) takes the company's records out of the app: everything in one zip for an auditor, or one list at a time as a spreadsheet. Admins, members and auditors can all download. Every download is written to the [activity log](activity-log.md) as `DATA_EXPORTED`, naming what was taken and who took it.

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

## Lists

`GET /v1/exports/csv/:dataset` returns one list as a CSV. `dataset` is one of `checklist`, `proof_requirements`, `evidence`, `policies`, `breaches`, `requests`, `people`, `activity` (`EXPORT_DATASETS` in `packages/shared`); any other value is `NOT_FOUND` (404). Each list is the whole table, not a page, and the same columns as in the pack, except that `proof.csv` and `policies.csv` have no column for a place in a pack.

CSV files are written for Excel: UTF-8 with a byte order mark, CRLF line ends, dates as ISO 8601 in UTC. A cell that starts with `=`, `+`, `-`, `@`, a tab or a carriage return is saved with a leading `'`, so text typed by a person is never run as a formula.

The activity log list is read in batches of 1,000 events.

## In the web app

Each download button fetches the file with the signed-in session and hands it to the browser to save, under the name the API sends in `Content-Disposition`. A failed download shows its error under the button.
