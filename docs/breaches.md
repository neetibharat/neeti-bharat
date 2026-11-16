# Breaches

A personal data breach is handled at `/breaches`, one step at a time, against a clock. Every breach is treated as reportable.

## The five steps

A breach moves through five steps, always in this order:

1. **Found.** Done when the breach is reported. It is dated with the time the breach was found, which may be earlier than the time it was typed in.
2. **Assess.** Find out what happened, what was affected and how many people.
3. **Tell the Board.** Send the full report to the Data Protection Board within the report window.
4. **Tell people.** Tell each affected person without delay, in plain language.
5. **Close.** Allowed only after the Board and the people have been told.

Completing a step out of order, or one that is already done, is refused (`STEP_ORDER`, 409). Each step can carry a note of up to 2,000 characters, saved with it as proof: for the two notices, the note says what was sent, to whom and when.

A breach is **open** until its close step exists, and then **closed**. Its details (title, what happened, when it was found, systems, data, people affected) can be edited only while it is open (`BREACH_CLOSED`, 409). Steps are never edited or removed.

## The clock

The clock starts when the breach was found. The Board must have the full report within the **Breach report window** in Company profile (`breachReportWindow`, such as "72 hours"). The answer is read as a length of time with `parseDuration` in `packages/shared`, which accepts minutes, hours, days, weeks, months (30 days) and years (365 days). When the answer is empty or cannot be read, 72 hours applies.

The API sends each breach's `reportDueAt` (found time plus the window) and `overdue`: true when the Board has not been told and the time is past `reportDueAt`. Telling the Board stops the clock, so a breach that is past its window stays overdue only until that step is done. The web app counts down from `reportDueAt` in days, hours and minutes and refreshes once a minute. Changing the window changes the deadline of every breach, because the deadline is worked out when it is read.

## The assignee

A breach can name one person who deals with it (`assigneeId`, a person in People who has not left). It is optional: a breach that names nobody is the DPO's. The person is chosen when the breach is reported, in the edit dialog, or on the breach page, where the change is saved as soon as it is made. Naming someone who has left or does not exist is refused (`VALIDATION_FAILED`, 400). A closed breach cannot be given to someone else (`BREACH_CLOSED`, 409).

When someone is marked as left, they come off every breach and [request](requests.md) that names them, and those fall back to the DPO. The leave response counts them with the other assignments.

## Who can do what

| Role    | Read breaches | Report, edit, complete steps |
| ------- | ------------- | ---------------------------- |
| admin   | yes           | yes                          |
| member  | yes           | yes                          |
| auditor | yes           | no                           |

## Where breaches show

- **Breaches page** (`/breaches`): three figures (open, overdue, closed), tabs for open and closed with their counts, a search on title and description, and a paged table with the step each breach is at, its clock and who it is assigned to ("Unassigned" when nobody is named). Open breaches list the late ones first, then the one found longest ago. Closed breaches list the most recently closed first.
- **One breach** (`/breaches/:id`): the five steps with who did each and when, the clock, the details with who it is assigned to, the step to do now with its note, and the notes of the steps done. Admins and members change the assignee there while the breach is open; auditors see it read-only.
- **Dashboard**: open breaches are the first items in what needs attention, for every role.
- **My work**: each open breach is an item of kind `breach`, dated by the Board deadline while the Board is not told. A breach that names someone is work for that person only. A breach that names nobody is work for whoever holds the DPO job and for admins. Admins still see every breach on the Breaches page and the Dashboard.

## What is recorded

Reporting, editing, each step, closing and a change of assignee are written to the [activity log](activity-log.md) in the same transaction as the change: `BREACH_REPORTED`, `BREACH_EDITED`, `BREACH_ASSIGNED`, `BREACH_STEP_COMPLETED` and `BREACH_CLOSED` (which stands for the close step). An edit is logged only when a detail changed, and an assignment only when the assignee changed, so a save that changes nothing logs nothing. Setting the assignee when reporting logs `BREACH_ASSIGNED` after `BREACH_REPORTED`. `BREACH_ASSIGNED` holds the title, with the name before and after (empty for nobody). The breach itself keeps the name of who reported it and, on each step, who completed it, when, and the note.

## API

| Route                               | What it does                                                                                  |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `GET /v1/breaches`                  | One page: `tab` (`open` or `closed`), `q`, `page`, `limit`; with `counts`                     |
| `GET /v1/breaches/:id`              | The breach with all five steps, `currentStep`, `reportDueAt` and `overdue`                    |
| `POST /v1/breaches`                 | Report a breach; `foundAt` defaults to now and cannot be in the future; optional `assigneeId` |
| `PUT /v1/breaches/:id`              | Change the details and the `assigneeId` (a person id or null) while the breach is open        |
| `POST /v1/breaches/:id/steps/:step` | Complete the next step, with an optional `note`                                               |

An unknown id is `NOT_FOUND` (404).

## What breaches do not do

- **Send notices.** The notices to the Board and to people are written and recorded by the team; the app sends nothing.
- **Link to the data map.** What was affected is free text.
- **Detect breaches.** A breach exists only when someone reports it.
- **Remind.** Nothing is sent as the deadline approaches.
