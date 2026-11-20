# Reports kept on proofs

Four proofs are really a report of what the kit already holds. The kit makes that report itself and keeps it on the proof, so nobody has to export it, save it and upload it.

| Proof                                   | The report                                                                                                  | Made from                         |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------- |
| GP02 – Cloud configuration check report | The latest check of each connected account: every check, its result, what was flagged and what was accepted | [Connections](connections.md)     |
| GP01 – Website check report             | The latest check of the public website, every check with its result and numbers                             | [Website check](website-check.md) |
| RC01 – Security awareness training      | How many people have completed every training in use, each person's progress and when they must finish      | [Training](training.md)           |
| RC26 – Policy approval records          | Every policy with the version, date and approver of its latest approval, and the ones never approved        | Policy approvals                  |

## When a report is made

The API looks once an hour. For each report it makes a new copy when what it reports on has changed since the last copy, and never twice in a day (a week for training, which changes with time and not only with events). A report with nothing to say is not made: no account checked, no website check run, no training in use, or no policy approved.

A copy is added to the proof like any other proof, named **Report: …** and added by **Automatic check**, and the activity log records it as proof added. Copies are never replaced or removed, so the proof keeps a dated trail of what was true at each point.

## A PDF, or a note

When [file storage](self-hosting.md) is set up, a report is kept as a PDF named after the report and the date, such as `cloud-configuration-check-2026-03-10.pdf`. It is stored and downloaded like an uploaded file, with its SHA-256 saved, so the audit pack can check it later. Without file storage it is kept as a note holding the same content as text, cut to the size of a note, so a company that has not set up storage still gets the proof.

A PDF holds the title, a line saying what it covers and when, then a section for each part with its table, and a last line saying the kit made it from its own records and changed nothing. People's names appear in the training report. Their email addresses do not.

## What a report is not

A report shows what the kit holds. It does not say the company is compliant, and a person still decides that. Proof that only a person can supply, such as a published notice or a signed agreement, is still added by people.

## In the code

- `apps/api/src/proof-reports/`: `services/proof-report.service.ts` decides which reports are due and keeps them, and `proof-report-scheduler.ts` is the hourly timer, which does not run in tests. `repositories/report-source.repository.ts` reads what the cloud, website and policy reports are made from, and the training report uses `TrainingService.report`.
- `utils/report-builders.ts` turns that data into a report as plain content (a title, sections, paragraphs and tables). `utils/report-pdf.ts` draws it as a PDF with `pdfkit`, and `utils/report-doc.ts` turns it into text for the note.
- `apps/api/src/frameworks/services/system-proof.service.ts` adds proof that no person wrote, as a note or a PDF, and is also what the notes from cloud checks use.
- A new report is a builder, an entry in `REPORTS` in `proof-report.service.ts` with its proof's catalogue id, and a test that the proof exists.
