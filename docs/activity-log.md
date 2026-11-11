# Activity log

Every change in the product is written to one log, shown at Settings → Activity log (admins only).

## How it is kept honest

- **Append-only.** The database refuses updates, deletes and truncates on `activity_events`. Code can only add rows.
- **A chain, not just a list.** Each event stores a fingerprint of itself and of the event before it. Edit or remove any event, even straight in the database, and every fingerprint after it stops matching. **Check integrity** on the page (or `GET /v1/activity/verify`) recomputes the whole chain and says whether it still holds.
- **An anchor at the end.** The chain alone cannot show that its newest events were deleted: what is left still links up. So every write also moves a one-row table, `activity_anchor`, to the newest event (its number and fingerprint), in the same transaction. The check confirms the chain reaches that event, and answers `ok: false, truncated: true` when it does not. The anchor is read before the chain, so events written during the check do not count against it. It catches mistakes and partial tampering. Someone who can change the database freely could move the anchor too; for that, copy the newest fingerprint somewhere outside the database from time to time.
- **Retention.** The Rules require keeping such logs for a set period (the "Log keep-for period" answer in Company profile), and people can ask for their personal data to be erased. The one allowed delete is a retention job that removes events older than that period, inside a transaction that sets `app.log_purge = 'on'`. The check treats the oldest remaining event as the start of the chain, so purging from the old end is never reported. The job must always leave the newest event in place, or the check reports the log as truncated. The job is not built.
- **Little personal data.** An event holds what is needed to say who did what: a name or email and the values changed. Do not put more in.

## Personal data in log details (to be confirmed)

This is the current stance. Nothing is built for erasure requests.

- Event details hold only what is needed to say who did what: a name or an email, and the values that changed. Nothing else about a person goes in.
- The log is append-only on purpose, so that it can serve as an audit record. Events are not edited, even to correct personal data.
- An erasure request is answered on the person record: it is anonymised (name, email and the other fields are cleared or replaced). The log keeps only the label recorded at the time of each event, and the retention job removes those events once the keep-for period ends.
- Open questions for the owner: whether a name or email in an old event counts as personal data that must go sooner than the keep-for period, and whether the legal basis for keeping it (audit duty) should be stated in the privacy notice.

## Recording a change

Call `ActivityService.record()` from the service that makes the change. It runs in the request's database transaction, so the event and the change are saved together:

```ts
await this.activity.record({
  actor: actorOf(session.user),
  action: 'INVITATION_CREATED', // add new codes to ACTIVITY_ACTIONS in packages/shared
  subject: { type: 'invitation', id },
  details: { email, role }, // fills in the sentence
  before: { value: oldValue }, // optional
  after: { value: newValue }, // optional
});
```

Then add the sentence under `activity.actions.<CODE>` and a filter name under `activity.actionNames.<CODE>` in `apps/web/messages/en.json`. A test fails if either is missing.

## What the log is not

It records **changes**, not reads. Do not log every API call: a consent check on each use of personal data would fill the table. Track last use and counts instead.
