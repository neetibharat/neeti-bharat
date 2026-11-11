# Requests

People ask to see, fix or erase their data, to name someone to act for them, or to complain. Each ask is a request, handled at `/requests` against a due date.

## Types

| Type         | What the person asks for                          |
| ------------ | ------------------------------------------------- |
| `access`     | A copy of the data held about them                |
| `correction` | To fix data that is wrong                         |
| `erasure`    | To have their data erased                         |
| `nomination` | To name someone to exercise their rights for them |
| `complaint`  | A grievance about how their data is handled       |

Each request has a short number that counts up from 1 and is never reused. It is shown as `REQ-12` (no zero padding) on the board, in the list and on the request's page, and searching for `REQ-12` or `12` finds it.

A request also records where it came from (`source`: `email`, `website` or `manual`). The form offers only email and added by hand, because the public page that would send `website` requests is not built.

## From new to done

A request has one of three statuses and moves in one direction.

1. **New.** Logged, nothing checked yet.
2. **In progress.** The identity is checked and the work is under way.
3. **Done.** The reply is written and the request is closed.

### The identity check

Work starts with an identity check that fits the request. Marking the identity verified (with an optional note on how it was checked) records who did it and when, and moves the request to in progress. Nothing is shared or erased before this: a task's outcome cannot be set until it is done (`IDENTITY_NOT_VERIFIED`, 409). A second check on the same request is refused (`CONFLICT`, 409).

### Tasks

Each system that holds the person's data becomes a task, named by the person working on the request (the data map that would list them is not built). Tasks can be added at any time while the request is open. A task is **to do** until it has an outcome:

| Outcome       | Meaning                                                        |
| ------------- | -------------------------------------------------------------- |
| `done`        | What was asked was done in that system                         |
| `erased`      | The person's data was erased from it                           |
| `kept_by_law` | The data is kept because the law says so; a reason is required |

`kept_by_law` without a reason is refused (`VALIDATION_FAILED`, 400). The reason is kept only for that outcome. A task can go back to to do, and can be removed only while it is to do (`CONFLICT`, 409 otherwise).

### Closing

Closing needs the identity checked, no task still to do (a request with no tasks can close) and a reply written. Otherwise it is refused (`REQUEST_NOT_READY`, 409). Closing saves the reply, who closed it and when. The request, its tasks and the activity log entries for it stay on record as the proof of what was done. A closed request cannot be edited, checked again or have its tasks changed (`REQUEST_CLOSED`, 409).

## The due date

When a request is logged its due date is set to the day it was received plus the **Grievance reply time** in Company profile (`grievanceReplyTime`, such as "90 days"), read with `parseDuration` in `packages/shared`. When the answer is empty or cannot be read, 90 days applies. The due date is stored with the request, so changing the profile later does not move requests already logged. The received time may be earlier than the time it was typed in, but not in the future.

A request is **overdue** when it is not done and the due date has passed. The API sends `overdue` with every request. The web app counts down in days, hours and minutes and refreshes once a minute; late requests are red.

## The assignee

A request can name one person who deals with it (`assigneeId`, a person in People who has not left). It is optional: a request that names nobody is the DPO's. The person is chosen when the request is logged, in the edit dialog, or on the request page, where the change is saved as soon as it is made. Naming someone who has left or does not exist is refused (`VALIDATION_FAILED`, 400). A request that is done cannot be given to someone else (`REQUEST_CLOSED`, 409).

When someone is marked as left, they come off every request and [breach](breaches.md) that names them, and those fall back to the DPO. The leave response counts them with the other assignments.

## Who can do what

| Role    | Read requests | Log, edit, check identity, work tasks, close |
| ------- | ------------- | -------------------------------------------- |
| admin   | yes           | yes                                          |
| member  | yes           | yes                                          |
| auditor | yes           | no                                           |

Complaints are requests like any other: every role that can read requests sees every complaint, because nothing is hidden. Editing is limited to the type, name, email, details and assignee, and only while the request is open.

## Where requests show

- **Requests page** (`/requests`): four figures (new, in progress, overdue, done), a type filter and a search on number, name, email and details, and a **Board | List** switch. The filter and the search apply to both views. The view is kept in the address: the board is the default and has no parameter, and the list is `?view=list`.
  - **Board**: three columns, New, In progress and Done, each headed by its count (the same head counts as the figures, which ignore the filter and the search). A column shows up to 10 cards. Open columns list the nearest due date first, so late requests lead. Done shows the 10 most recently closed. A card is a link to the request and shows the person's name, who it is assigned to (or "Unassigned"), `REQ-12 · Copy of data` and a due badge: "Due in 11 days" (amber within 7 days), "2 days late" in red once overdue, and for done requests "Closed on time" or "Closed late", by whether it was closed by its due date. When a column holds more than it shows, "Show more" loads the next page of that column from the list. Done also links "See all closed" to the list on its Done tab. An empty column says so quietly.
  - **List**: tabs for each status with their counts, and a paged table with the number, the due date, the time left, the tasks done ("2 of 3") and who it is assigned to. Open requests list the nearest due date first, so late ones lead. Done requests list the most recently closed first.
- **One request** (`/requests/:id`): the details with who it is assigned to (admins and members change it there while the request is open; auditors see it read-only), the identity check, the tasks, the reply and the reply clock.
- **Dashboard**: open requests that are overdue, or due within 7 days, are in what needs attention. Late ones sit with late proof, and those coming up come after approvals. Closing a request removes it.
- **My work**: each open request is an item of kind `request`, dated by its due date. A request that names someone is work for that person only. A request that names nobody is work for whoever holds the DPO job and for admins. Admins still see every request on the Requests page and the Dashboard.

## What is recorded

Every change is written to the [activity log](activity-log.md) in the same transaction as the change: `REQUEST_RECEIVED`, `REQUEST_EDITED`, `REQUEST_ASSIGNED`, `REQUEST_IDENTITY_VERIFIED`, `REQUEST_TASK_ADDED`, `REQUEST_TASK_UPDATED`, `REQUEST_TASK_REMOVED` and `REQUEST_CLOSED`. An event holds the request type and the person's name, never the details or the email. An edit is logged only when a detail changed, and an assignment only when the assignee changed, so a save that changes nothing logs nothing. Setting the assignee when logging records `REQUEST_ASSIGNED` after `REQUEST_RECEIVED`. `REQUEST_ASSIGNED` also holds the name of the assignee before and after (empty for nobody). The request keeps the names of who logged it, checked the identity and closed it.

## API

| Route                                   | What it does                                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `GET /v1/requests`                      | One page: `tab` (`new`, `in_progress` or `done`), `type`, `q`, `page`, `limit`; with `counts`        |
| `GET /v1/requests/board`                | The first cards of each column: `type`, `q`, `limit` (1 to 50, default 10 per column); with `counts` |
| `GET /v1/requests/attention`            | Up to five open requests that are late or due within 7 days, nearest first, with a `total`           |
| `GET /v1/requests/:id`                  | The request with its tasks and `overdue`                                                             |
| `POST /v1/requests`                     | Log a request; `receivedAt` defaults to now, `source` to `manual`; optional `assigneeId`             |
| `PUT /v1/requests/:id`                  | Change type, name, email, details and `assigneeId` (a person id or null) while the request is open   |
| `POST /v1/requests/:id/identity`        | Record the identity check, with an optional `note`                                                   |
| `POST /v1/requests/:id/tasks`           | Add a task (`system`)                                                                                |
| `PUT /v1/requests/:id/tasks/:taskId`    | Set `outcome` and, for `kept_by_law`, `reason`                                                       |
| `DELETE /v1/requests/:id/tasks/:taskId` | Remove a task that is still to do                                                                    |
| `POST /v1/requests/:id/close`           | Close with the `replyNote`                                                                           |

The board returns `new`, `in_progress` and `done` as lists of cards (`id`, `number`, `type`, `personName`, `status`, `dueAt`, `overdue`, `closedAt`, `closedOnTime`, `assigneeName`) and `counts`. `closedOnTime` is true when the request was closed by its due date, false when later and null while it is open. The list items carry `number`, `closedOnTime` and `assigneeName` too, and one request carries `assignee` (`id` and `name`, or null).

An unknown id is `NOT_FOUND` (404).

## What requests do not do

- **Take requests from the public.** There is no customer page yet; requests are logged by hand.
- **Find the data.** Systems are free text. Nothing links to a data map, and nothing is erased by the app.
- **Send the reply.** The reply is written and recorded by the team; the app sends no email.
- **Add proof.** The closed request is the record. Nothing is added to the Proof page.
- **Remind.** Nothing is sent as the due date approaches.
