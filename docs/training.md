# Training and policy acceptance

The Training page (`/training`) holds the trainings the company asks everyone to take, the policies everyone has to read and accept, and who has done both. The Act expects people who handle personal data to know their duties, and an auditor will ask who was trained, who accepted which policy, and when.

The app does not host videos or courses. Each training names what it teaches and links the company's own video or document. A person opens it, takes it, and marks it done here.

## Trainings

| Field           | What it holds                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name            | Unique, ignoring capitals.                                                                                                                              |
| What it teaches | A line or two.                                                                                                                                          |
| Link            | One optional link to the company's own material. Only `http` and `https`.                                                                               |
| Every year      | Whether it is taken again each year. A completion then lapses after 365 days, and the training shows as due again for the month before.                 |
| Archived        | A training that is no longer asked for is archived, not deleted, so who took it stays on record. It leaves everyone's list and can be asked for again.  |
| Completion      | That one person has taken one training, and the day. Taking it again moves the day. A person who has left keeps their completions but no longer counts. |

A company with no trainings is offered four suggested ones, on the Act, handling personal data, breaches and data requests. They say what is taught and carry no links. They can be changed or archived like any other.

### Where a person stands

| Status | Meaning                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------- |
| To do  | Never taken, or a yearly training that has lapsed.                                                |
| Done   | Taken, and still current.                                                                         |
| Renew  | A yearly training that lapses within 30 days. It still counts as done, and is shown as due again. |

A training never taken is due 30 days after the person was added, or after the training was added if that is later. It is late once that day has passed.

## Policy acceptance

Each approved policy that is not archived can be read and accepted by every person. Accepting records the person and the day. When a policy is approved again, earlier acceptances show as "accept again", and the person has to accept the new version. Only a person can accept for themselves; an admin cannot accept on someone's behalf.

## The page

| Tab         | Who sees it         | What it shows                                                                                                                                                                                                                 |
| ----------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| My training | Everyone            | Each training in use with where you stand: a tick and the day once done, the day it is due or late, and, for a yearly one, when it lapses. **Open** goes to the link and **Mark as done** records it. **Undo** takes it back. |
| Policies    | Everyone            | Each approved policy with a status of to accept, accepted or accept again, and **Read** and **Accept**.                                                                                                                       |
| Team        | Admins and auditors | A search and one page of people, each with training and policy progress and a status. Above it: how many people have done all the training, and accepted every policy. A name opens the person's page.                        |
| Trainings   | Admins              | The trainings in use and archived, how many people have taken each, and buttons to add, change and archive.                                                                                                                   |

Once nothing is left to do, My training shows a banner with a **Certificate** button. The certificate (`/training/certificate`) names the person, the company, each training with its day, and the day it was issued. It prints cleanly, so it can be saved as a PDF from the browser.

Everyone with a login takes their own training. A person who is not yet on the People list sees nothing to do and cannot record anything. Auditors can read but not record.

## A person's page

Admins open a person from the People list (`/settings/people/:id`). It has three tabs: their details, their training, and the policies they have accepted. On the training tab an admin can record or take back a completion for them. There is also a link to their open work.

## Reminders

A training that is to do, or due again, is work for the person who has to take it. It appears in My work on its own tab, on the Dashboard, and, once it is due within 3 days or late, in the daily [notices](notifications.md). Policy acceptance does not make work or notices.

## Activity

Adding, changing, archiving and bringing back a training, recording or taking back a completion, and accepting a policy are written to the [activity log](activity-log.md). A completion names the person it is for.

## API

| Route                                         | Who              | What it does                                                        |
| --------------------------------------------- | ---------------- | ------------------------------------------------------------------- |
| `GET /v1/trainings`                           | Everyone         | Every training with how many people have taken it.                  |
| `GET /v1/trainings/mine`                      | Everyone         | The trainings in use with where the signed-in person stands.        |
| `GET /v1/trainings/of/:personId`              | Admins, auditors | The same for one person.                                            |
| `GET /v1/trainings/team`                      | Admins, auditors | One page of people with how far each has got. `q`, `page`, `limit`. |
| `POST /v1/trainings`                          | Admins           | Adds a training.                                                    |
| `POST /v1/trainings/starters`                 | Admins           | Adds the suggested trainings the company does not have yet.         |
| `PATCH /v1/trainings/:id`                     | Admins           | Changes a training that is in use.                                  |
| `POST /v1/trainings/:id/archive`              | Admins           | Stops asking for a training. `restore` asks for it again.           |
| `POST /v1/trainings/:id/complete`             | Admins, members  | Records that you took it. An admin can send `personId` for someone. |
| `DELETE /v1/trainings/:id/complete`           | Admins, members  | Takes it back. An admin can send `personId` for someone.            |
| `GET /v1/policy-acceptance/mine`              | Everyone         | The approved policies with where the signed-in person stands.       |
| `GET /v1/policy-acceptance/of/:personId`      | Admins, auditors | The same for one person.                                            |
| `GET /v1/policy-acceptance/team`              | Admins, auditors | One page of people with how many policies each has accepted.        |
| `POST /v1/policy-acceptance/:policyId/accept` | Admins, members  | Accepts an approved policy as yourself.                             |
| `GET /v1/people/:id`                          | Admins           | One person.                                                         |

## Not built

- Reminders for policies that are waiting to be accepted.
- Recording a completion for someone from the Team tab. It is on the person's page.
- A certificate that is signed or checked by anyone else.
