# Notifications

A notification tells a person that something of theirs is due soon or late. It is made from the same list as **My work**, so a person is told about what they would see there, and nothing else.

## What is notified

Four kinds of dated work:

| Kind          | Dated by                                           | Notified when              |
| ------------- | -------------------------------------------------- | -------------------------- |
| Breach        | The Board report deadline, until the Board is told | Due within 3 days, or late |
| Request       | The reply date                                     | Due within 3 days, or late |
| Proof         | The next date proof is due                         | Due within 3 days, or late |
| Policy review | One year after approval                            | Due within 3 days, or late |
| Vendor        | A vendor's review date                             | Due within 3 days, or late |
| Training      | The day a training is due, or due again            | Due within 3 days, or late |

Work with no date, such as a policy waiting for approval or a draft, is not notified. Who a notice goes to is the same as in My work: the person an item names; for an item that names nobody, whoever holds the DPO job, and admins. Only people who can sign in are notified, and a person is matched to their login by email, as everywhere else.

## When

A check runs when the API starts and then every hour. From 9:00 India time it makes the day's notices, and before that it does nothing. A person is told **once** about each thing in each state (due soon, then late). If the due date moves, it is a new date and is told again. Running the check twice, or from several copies of the API, makes nothing twice: each notice has a key, and the database refuses a second one with the same key.

The check does not run when `NODE_ENV` is `test`.

## Where a person sees them

- **The bell** at the foot of the sidebar shows how many are unread, and opens the inbox at `/notifications`. It asks for the count once a minute.
- **The inbox** lists a person's notices, newest first, a page at a time. Opening one marks it as read and goes to the breach, request, proof, policy or vendor. **Mark all as read** clears the count.
- **Email** is sent for the same notices, through the SMTP server set up for sign-in links (see [self-hosting.md](self-hosting.md)). Without one, the text is written to the API log in development.

## Choosing

Whether a person gets a kind of notice, in the inbox and by email, is decided in three steps, the first that applies winning:

1. The person's own choice for that kind.
2. The default for their role (admin, member or auditor), set by an admin.
3. On, in both ways.

**Settings, Notifications** has two tabs. **My notifications** is for everyone: a switch for the inbox and one for email, for each kind, saved as it is changed. It shows what applies to the person now, so until they change a switch it shows their role's default. **Defaults by role** is for admins: a matrix with a row for each role and way of being told, and a column for each kind, saved together with one button. Changing it is written to the activity log; a person's own choices are not.

The choice is the person's own and applies in the organisation they are working in. A notice that is emailed but not wanted in the inbox is kept, already read. Every role, auditors included, can read and choose their own.

## The API

All under `/v1/notifications`, for admins, members and auditors, each person seeing only their own.

| Route                |                                                                              |
| -------------------- | ---------------------------------------------------------------------------- |
| `GET /`              | A page of notices (`page`, `limit`, `unread=true`), with how many are unread |
| `GET /unread-count`  | Just the count                                                               |
| `POST /:id/read`     | Marks one as read                                                            |
| `POST /read-all`     | Marks all as read                                                            |
| `GET /preferences`   | Every kind, with the person's choice                                         |
| `PUT /preferences`   | Changes the kinds listed, one entry for each                                 |
| `GET /role-defaults` | What each role gets, for every role and kind (admins only)                   |
| `PUT /role-defaults` | Changes the role and kind pairs listed (admins only)                         |

A notice holds its kind, its state, what it is about and the date. The sentence is made on screen, so it follows the language.

## Where the code is

- `apps/api/src/notifications/`: the routes, the repositories, `notification-scanner.ts` (finds the work and makes the notices), `notification-scheduler.ts` (the hourly timer) and `utils/notice-candidates.ts` (the rule: what counts as due soon, and when the day's check starts).
- `apps/web/src/components/notifications/`: the bell, the inbox and the settings page.
- The email is the `notice` template in `apps/api/src/core/mail/templates.ts`.
