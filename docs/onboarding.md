# Onboarding and the readiness check

## Set-up of a new organisation

An [organisation](organizations.md) that someone has just created is set up before it is used. After creating it, the admin is sent to `/onboarding`. Everyone else who opens the organisation in the meantime is not held back. An organisation counts as set up once `organizations.onboardedAt` is set; the Organisations list sends `onboarded` with each one, and the app asks an admin of an organisation that is not onboarded to finish. Organisations that existed before onboarding was added are already marked as set up.

The set-up has four steps and can be skipped at any point with **Skip for now**, which ends it the same way as finishing:

1. **Your company.** Company name, website, where data is stored, languages offered, and the logo (a PNG, JPG or WebP; this needs [file storage](self-hosting.md)). These are the Company profile answers of the same names, so they fill policies, notices and reports. Saving the Company name answer also renames the organisation, here and anywhere else it is changed: the answer and the organisation's name are kept the same.
2. **Scope.** DPDP is chosen as the framework (it is the only one, and it is switched on for every organisation). The three set-up questions that switch DPDP rules on or off, children's data, data sent abroad and a Significant Data Fiduciary, are the same answers as the Set-up tab of a framework. The grievance email and the breach contact are the Company profile answers `grievanceEmail` and `breachContact`.
3. **Readiness check.** See below.
4. **Your score.** The result, with where to start. **Go to my dashboard** ends the set-up.

Each step saves its answers when **Continue** is pressed, and only those that changed. `POST /v1/organizations/current/onboarding` (admin only) ends the set-up. It is idempotent: the first call writes `ONBOARDING_COMPLETED` to the activity log, and later calls change nothing.

## Getting started on the dashboard

Until four jobs are done, admins and members see a **Get started** card at the top of the dashboard (auditors do not). Each job opens the page where it is done, and the first one not done is highlighted:

1. **Company profile:** the Company profile answers `companyName`, `grievanceEmail` and `breachContact` are all filled in.
2. **People:** at least one active person besides the signed-in one.
3. **Readiness check:** one has been taken.
4. **First policy:** one policy is approved.

The card works these out from the same data the rest of the page reads (`lib/getting-started.ts`) and disappears once all four are done.

## The readiness check

The readiness check is 25 yes/partly/no questions in eight areas, worth 100 points. Its page (`/readiness`) shows the latest score, how each area did, where to start, and the scores of earlier checks. Admins and members can take it again; auditors can read it.

| Area                        | Points | Questions |
| --------------------------- | ------ | --------- |
| Who is responsible          | 15     | 3         |
| Notice and consent          | 20     | 3         |
| People's rights             | 15     | 3         |
| Knowing your data           | 10     | 3         |
| Security                    | 15     | 3         |
| Vendors and partners        | 10     | 3         |
| Breaches and keeping data   | 10     | 3         |
| Children and sensitive data | 5      | 4         |

The questions, areas and points are in `packages/shared/src/readiness.ts`; their wording is in `apps/web/messages/en.json` under `readiness`. A question that rests on a section of the DPDP Act carries it as `reference`.

**Scoring.** Each question is worth an equal share of its area. Yes is all of that share, partly is half and no is none. One question may be answered "not applicable" (parental consent, for a company that handles no children's data): it is left out of its area instead of counting against the company. The score is the sum of the area points earned, rounded to a whole number out of 100. The API works the score out itself (`scoreReadiness`); a score sent in is never used.

| Score  | Band            |
| ------ | --------------- |
| 0–39   | Just starting   |
| 40–69  | Building up     |
| 70–89  | Well on the way |
| 90–100 | Strong          |

**Where to start** names up to three areas below 60%, lowest first, and links each to the part of the app where it is worked on (People and roles, Policies, Requests, Proof, Breaches or Frameworks).

## API

| Route                                       | Roles                  | What it does                                                                                                                                                                                                        |
| ------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /v1/readiness`                         | admin, member, auditor | The latest check in full (answers and each area's score) and the scores of the last 10 checks                                                                                                                       |
| `POST /v1/readiness`                        | admin, member          | Takes the check with `{ answers }`. Every question must be answered, and "not applicable" only where it is offered, or it is refused with `VALIDATION_FAILED` (400). Writes `READINESS_CHECKED` to the activity log |
| `POST /v1/organizations/current/onboarding` | admin                  | Ends the set-up of the organisation                                                                                                                                                                                 |

Every check is kept, with who took it and when, so scores can be compared over time.
