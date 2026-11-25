# Vendors

The Vendors page (`/vendors`) lists the companies that handle the company's personal data on its behalf, such as a cloud host or a payroll tool. The Act makes the company answerable for them. For each vendor the app keeps what it does, what data it is given and where it keeps it, how far it has been assessed, and how risky it is.

## What is kept for each vendor

| Field          | What it holds                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Name           | Unique, ignoring capitals.                                                                                                                  |
| What it does   | A sentence on the service, a kind (cloud and hosting, payments, email and messaging, HR and payroll, and so on), and a website.             |
| Status         | Not assessed, in progress, or assessed: how far the company has got with looking at the vendor.                                             |
| Owner          | The person who answers for the vendor. Cleared when that person is marked as left.                                                          |
| Data and place | One or more kinds of personal data it is given, and where it keeps them: India, abroad, or both. Empty until someone says.                  |
| Agreement      | One optional link to the agreement, kept in the company's own storage, such as Google Drive or SharePoint. Only `http` and `https`.         |
| Review date    | The day to look at the vendor again.                                                                                                        |
| Treatment      | What the company has decided to do about the risk: reduce it, share it, accept it or avoid it, and why in a few words. Empty until decided. |
| Risk           | Two ratings, each a likelihood and an impact from 1 to 5: before anything is done, and after the company's own measures.                    |

## A vendor's page

A vendor's name opens its own page (`/vendors/:id`). Adding a vendor asks only for its name, website, what it does, its kind, its status and its owner, and then opens this page to fill in the rest. It shows, from the top:

- **Still to do**, when something is missing: the data and place are not said yet, it is not assessed, or its review date has passed.
- **Risk**, with the risk now, a map of where it started and where it is, and two sets of questions to rate it (below).
- **Treatment**, the decision about the risk, with a chart of how far the company's measures bring the score down (below).
- **Details, Data and place, and Agreement and review**, each a card with its own Edit button that opens a short form for that part only.
- **History**, every change made to this vendor, newest first, ten to a page. It reads the [activity log](activity-log.md) for this one vendor, so it follows the vendor, not the person.

An archived vendor shows a note and cannot be changed until it is brought back.

## Risk

Risk is rated the same way for every vendor, with two questions answered from 1 to 5. **Likelihood** runs from very unlikely to very likely, and **impact** from insignificant to severe, each 1 to 5. The **score** is likelihood times impact, from 1 to 25, and the level follows from it:

| Level     | Score    |
| --------- | -------- |
| Very low  | 1        |
| Low       | 2 to 4   |
| Medium    | 5 to 9   |
| High      | 10 to 16 |
| Very high | 17 to 25 |

There are two ratings. **Inherent risk** is how risky the vendor is before the company does anything about it. **Risk after your measures** is what is left once the company's own measures, such as the agreement and checks, are in place. Answering both questions saves the rating at once, and "Start again" takes it back. The list shows the risk after the measures once that is rated, otherwise the inherent risk, otherwise "Not rated yet".

The risk is drawn on a **map**: impact across, likelihood up, with smooth bands in the colour of each level. A ring marks where the risk started and a solid dot where it is after the measures, with an arrow between them. While the inherent risk is not rated, a **suggested** rating is offered, worked out from what is recorded (`suggestRating` in `packages/shared/src/vendors.ts`): how bad a loss would be follows the data (4 when it includes health, IDs, financial details, biometrics or children's data, otherwise 3), and how likely one is follows the place (2 in India, 3 in both, 4 abroad). It says nothing until both the data and the place are said. It is a place to start from, and nobody has to take it.

## Treatment

The Treatment tab holds the company's decision about a vendor's risk, which is what an auditor asks for after the rating:

- **What will be done.** One of four: **reduce** it (add safeguards, contract terms or checks), **share** it (move the risk to someone else, for example by contract or insurance), **accept** it (the risk is low enough, or not worth reducing), or **avoid** it (stop using the vendor, or stop giving it the data).
- **Why.** A few words on why that is the right decision, up to 1,000 characters.

Both are saved with the Save button, which is offered only while something differs from what is saved. A change is written to the [activity log](activity-log.md) as a change to the vendor.

Above it, **Risk reduction** draws the score before and after the company's measures as a ramp of 25 ticks, one per point, coloured by level: solid up to the score now, hatched for the points the measures took off, with a pill over each score. Beside it, a large figure says what share of the risk the measures took off, or added. It needs both ratings from the Risk tab, and says so when one is missing.

## Reminders

A vendor's review date becomes work for its owner:

- It shows in **My work** (the Vendors tab) from 30 days before, and as overdue once passed.
- It makes a **notice** (in the app and by email, as the person chose) when it is due within 3 days, and again when it is late. See [notifications](notifications.md).
- A vendor with no owner is the DPO's, and the admins', as with breaches.

## The tabs

- **In use.** Every vendor that is not archived.
- **Needs a look.** A vendor in use whose data or place is not said yet, that is not assessed yet, or whose review date has passed. Each row says which of these applies. A date counts as passed once the day it names is over.
- **Archived.** A vendor that is no longer used. It keeps its row, so what it was given stays on record. It can be brought back.

Each tab shows its count, and the counts do not change with the search. The search looks at the name, the website and what the vendor does. Lists are paged 25 to a page, and the search, the tabs, the counts and the paging are done by the API.

## Who can do what

Admins and members add, change, archive and restore vendors, and place their risk. Auditors can only read. Every change is written to the [activity log](activity-log.md), and an archived vendor cannot be changed until it is brought back.

## API

| Route                          | Who                    | What                                                                                                                                                                                                                                                    |
| ------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /v1/vendors`              | admin, member, auditor | One page of vendors. Pick a `tab` (`active`, `attention`, `archived`), search with `q`, and page with `page` and `limit`.                                                                                                                               |
| `GET /v1/vendors/:id`          | admin, member, auditor | One vendor, with its ratings, the suggested square, and why it needs a look.                                                                                                                                                                            |
| `GET /v1/vendors/:id/activity` | admin, member, auditor | What has been done to one vendor, newest first, a page at a time with `page` and `limit`.                                                                                                                                                               |
| `POST /v1/vendors`             | admin, member          | Add a vendor.                                                                                                                                                                                                                                           |
| `PATCH /v1/vendors/:id`        | admin, member          | Change a vendor that is in use. A field sent as `null` is emptied. `inherent` and `residual` each take `{ likelihood, impact }`, both 1 to 5, or `null`. `treatment` is `mitigate`, `transfer`, `accept` or `avoid`, and `treatmentNote` is the reason. |
| `POST /v1/vendors/:id/archive` | admin, member          | Take a vendor out of use.                                                                                                                                                                                                                               |
| `POST /v1/vendors/:id/restore` | admin, member          | Bring an archived vendor back.                                                                                                                                                                                                                          |

A name that is already taken, a change to an archived vendor, and archiving or restoring twice are refused with `CONFLICT`. An owner who has left is refused with `VALIDATION_FAILED`.

## Not built

- Contacts for each vendor, and comments on a vendor.
- Tasks for each vendor, and tying the risk after the measures to tasks that must be finished first.
- A link from a vendor to the policy that covers it, or from a vendor to the data map.
- Reading vendors from a connection.

## Where the code is

| Part     | Where                                                                                  |
| -------- | -------------------------------------------------------------------------------------- |
| API      | `apps/api/src/vendors/`                                                                |
| Web      | `apps/web/src/components/vendors/`, `apps/web/src/lib/vendors.ts` and `vendor-risk.ts` |
| Shared   | `packages/shared/src/vendors.ts` (the lists, the types and the risk rules)             |
| Database | The `Vendor` model in `apps/api/prisma/schema.prisma`                                  |
