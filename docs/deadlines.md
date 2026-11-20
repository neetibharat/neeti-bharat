# Deadlines

The **Deadlines** page (`/deadlines`, under Workspace) lists every dated job in the company, whoever it belongs to, on three tabs: **Overdue**, **This week** (the next 7 days) and **Later**. Each tab shows its count. Admins, members and auditors can read it. My work shows what is waiting on one person; Deadlines shows all of it, with who has each job.

## What has a date

| Kind     | Dated by                                                            | Left out when                        |
| -------- | ------------------------------------------------------------------- | ------------------------------------ |
| Breach   | The Board report deadline: when it was found plus the report window | The Board has been told              |
| Request  | Its reply date                                                      | It is closed                         |
| Proof    | When it falls due, or when the last proof goes stale                | It is in and fresh, or has no date   |
| Vendor   | Its next review date                                                | The review is more than 30 days away |
| Training | The date it is due to be taken                                      | It has been taken                    |
| Policy   | A year after approval, for the review                               | The review is more than 30 days away |

A deadline is on the Overdue tab once its time has passed. A breach is dated to the hour, so its row says how many hours are left ("Due in 20 hours") or how late it is ("3 hours late"); the others count in days.

## API

| Route                                 | Roles                  | What it does                                                                                              |
| ------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `GET /v1/deadlines?tab=&page=&limit=` | admin, member, auditor | One page of the deadlines on a tab (`overdue`, `week` or `later`), earliest first, with the count of each |

The answer is `DeadlinesResponse` in `packages/shared/src/deadlines.ts`. Each item is a My work item with its date and `assigneeName`, which is null when the job falls to the DPO and admins. The dates are worked out in `apps/api/src/frameworks/utils/deadlines.ts` from the same readers My work uses.
