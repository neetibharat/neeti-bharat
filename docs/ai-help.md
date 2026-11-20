# AI help

AI help lets a company connect an AI service of its own, so DPDP Kit can help with four jobs. It is optional: everything else works without it, and a person always checks and approves what it suggests. Nothing the AI says is saved on its own.

## What it is used for

| Feature         | Where                                                | What it does                                                                                                                                                                                                                      | What is sent                                                |
| --------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `policy_import` | Add policy, Edit details                             | Reads a policy out of a PDF, Word or PowerPoint file. See [Start from a file](#start-from-a-file).                                                                                                                                | The text of the file and the company profile answers        |
| `policy_tailor` | A draft policy's text card, **Tailor to my company** | Proposes a rewrite of the draft using the company profile answers, keeping its sections and legal meaning, with a line for each change and the answers it would still like. The person reads it and chooses **Replace the text**. | The text of the policy and the company profile answers      |
| `policy_check`  | A policy's text card, **Check against the rules**    | Reads the policy against the controls it is linked to and says, for each, whether it is covered, partly covered or missing, and what to add. A second opinion, not legal advice.                                                  | The text of the policy and the rules and controls it covers |
| `proof_check`   | A piece of proof, **Check with AI**                  | Says whether a file or note looks like what its proof requirement asks for, what is not shown, a clearer title and any date the document carries.                                                                                 | The text of the file or note and what it was added for      |

Every use asks first: the dialog says what it will send, to which service and model, and waits for **Run**. Proof is judged from its text alone: a picture, a scan or a link on its own has no text, and is refused with `NOTHING_TO_CHECK`. A policy that covers no control also has nothing to be checked against. A policy can only be tailored while it is a draft.

An admin can switch each feature off under **Settings, AI help, What AI help is used for**. A switched-off feature disappears from the app and its route answers `AI_FEATURE_OFF`. The key and the model are not touched.

## Changing the service or the model

The service, the model and the key are one setting a company, read at the moment of each call. Every feature is a prompt and a checked answer shape, and none of them knows which service answers. To move to another model or service, an admin saves the new setting under **Settings, AI help**: nothing else changes, and nothing is deployed. Adding a service DPDP Kit does not know yet is a change in one place: its address and request shape in `ai/providers/ai-client.ts`, and its name in `AI_PROVIDERS` in `packages/shared`.

## Setting it up

An admin opens **Settings, AI help** and picks:

| Field      | What it is                                                                                                                                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI service | OpenAI, Anthropic (Claude) or DeepSeek. Each is called at its own fixed address, so a key can only ever be sent to the service it belongs to.                                                                                                      |
| Model      | The model that reads the files, named as the service names it. DeepSeek and Anthropic start with a suggestion (`deepseek-flash`, `claude-haiku-5-5`); OpenAI starts empty. Any text up to 80 characters of letters, digits, `.`, `:`, `_` and `-`. |
| API key    | The company's own key for that service.                                                                                                                                                                                                            |

On **Save** the API makes one small real call to the service with that key and model. A wrong key, or a model name that does not exist, is refused with the service's own reason, and nothing is kept. Only then is the key sealed and stored.

- **The key is encrypted.** It is sealed with the install's `SECRETS_ENCRYPTION_KEY`, tied to the organisation, the same way connection credentials are. Without that variable the page says so and nothing can be saved.
- **The key is never sent back.** The page shows the service, the model, the last four characters of the key and who set it. To change the key, enter it again.
- **One service a company.** Saving replaces the one there. **Remove** forgets the key.
- **Only a person sets it.** An API key cannot set or remove it. Setting it up and removing it are written to the activity log (`AI_CONFIGURED`, `AI_REMOVED`) with the service and model, never the key.

## Start from a file

Both dialogs are wide, with the file on the left and the form it fills in on the right. They stack on a narrow screen.

In **Add a policy**, a drop zone reads a `.pdf`, `.docx` or `.pptx` file of up to 10 MB. Where AI help is not set up, the same place says so, and links admins to the setting.

1. **The text is taken out of the file**, on the API, without the AI: PDF text, Word paragraphs with their heading styles and list items, PowerPoint slide by slide. The type is checked from the file's first bytes as well as its name. A scan with no text in it cannot be read, and a file with far more text than a policy (80,000 characters) is refused. Old `.doc` and `.ppt` files are not supported.
2. **The company's AI service is asked** to turn that text into a title, a summary, the owner job, the approver's title and the policy text. It is told to keep the document's own wording and section order, to leave out the title, the table of details at the top (ID, version, owner, approver, approval fields) and page furniture, to turn table rows into bullets, and to treat the document as data and ignore instructions written in it. It is also sent the company's answers (key and value, such as `companyName`) and told to write `{{key}}` in place of any of those facts the document states, so the text stays right when an answer changes. Answers shorter than three characters or empty are not sent, and a key that is not in the list is never used. These answers go to the AI service along with the document.
3. **The form fills in.** Whatever the file did not say is flagged: a title or summary the AI had to write is marked as a suggestion, and an owner or approver the file left out is left for the person to choose.
4. **The person checks, edits and adds the policy.** Nothing is saved until they click Add policy. The policy is then created as a draft with the text already in it, and its page opens for further editing.

**Nothing from the file is kept.** It is read in memory and discarded. The text of the file is sent to the service the company chose, with the company's key, to be read; the page says so.

## Update from a file

The same panel is in **Edit details** on a policy. Reading a file fills the title, summary, owner and approver’s title, and whatever the file does not say keeps its current value. Nothing is saved until **Save**.

- **Replacing the text.** For a **draft**, a checkbox, on by default, also replaces the text now in the editor with the text read from the file. The details are saved first, and the text only once they are saved. The replacement is recorded as an edit in the activity log, like any change to the text.
- **Not a draft.** A policy that is in review or approved cannot have its text replaced. The checkbox is replaced by a note to send it back or reopen it first, and the details can still be updated.

Reading takes a few seconds for a short policy and up to about a minute for a long one.

## Activity log

Each use is written to the activity log as `AI_USED`, naming the feature, the service and the model, and what it was about (a policy, or the control a piece of proof belongs to). It is written once the AI has answered, so a failed call leaves nothing. Switching features is written as `AI_FEATURES_CHANGED`. The text that was sent is never kept in the log.

## Routes

| Route                                                     | Who                             | What                                                                                                                                                 |
| --------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /v1/ai`                                              | admin, member, auditor          | `{ enabled, provider, model, keyHint, configuredByName }`. `enabled` is false when the install has no secrets key.                                   |
| `PUT /v1/ai`                                              | admin, never an API key         | `{ provider, model, apiKey }`. Tries them with the service, then keeps the key sealed.                                                               |
| `DELETE /v1/ai`                                           | admin, never an API key         | Forgets the key.                                                                                                                                     |
| `PUT /v1/ai/features`                                     | admin, never an API key         | `{ disabledFeatures }`. Switches features off or on without touching the key or the model. `GET /v1/ai` also returns `disabledFeatures`.             |
| `POST /v1/policies/:id/tailor`                            | admin, member, never an API key | Rewrites a draft for the company: `{ content, changes, missingAnswers }`. Saves nothing. A policy that is not a draft is `CONFLICT` (409).           |
| `POST /v1/policies/:id/check`                             | admin, member, never an API key | `{ summary, rules }`, with a verdict (`covered`, `partly`, `missing`), a note and a suggestion for each control. Saves nothing.                      |
| `POST /v1/controls/:controlId/evidence/:evidenceId/check` | admin, member, never an API key | `{ verdict, reason, missing, suggestedTitle, dateOnDocument }`. Saves nothing.                                                                       |
| `POST /v1/policies/import`                                | admin, member, never an API key | A multipart form with a `file`. Replies with `{ title, summary, ownerRole, approverTitle, content, titleFromFile, summaryFromFile }`. Saves nothing. |

`POST /v1/policies` takes the reply's fields and an optional `content`, the editor's JSON, to start the policy with its text.

An API key cannot read a file, because that would spend the company's AI key without a person choosing to.

## Errors

| Code                     | When                                                                                                                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AI_NOT_CONFIGURED`      | A file was sent and no AI service is set up (409).                                                                                                                                                                |
| `AI_FAILED`              | The service refused or did not answer (400 when saving, 502 when reading). `params.reason` is `key`, `busy`, `timeout`, `empty`, `unusable` or `other`, and `params.detail` is what the service said for `other`. |
| `AI_FEATURE_OFF`         | An admin has switched this feature off (409). `params.feature` says which.                                                                                                                                        |
| `NOTHING_TO_CHECK`       | The proof is a picture, a scan or a link on its own, or the policy covers no control (422).                                                                                                                       |
| `FILE_UNREADABLE`        | The file has no text, or is damaged or not what its name says (422).                                                                                                                                              |
| `FILE_TOO_LONG`          | The file has more text than any policy (422).                                                                                                                                                                     |
| `FILE_TYPE_NOT_ALLOWED`  | The file is not a PDF, `.docx` or `.pptx`, or its contents do not match its name (400).                                                                                                                           |
| `FILE_TOO_LARGE`         | The file is over 10 MB (400).                                                                                                                                                                                     |
| `SECRETS_NOT_CONFIGURED` | A key cannot be kept because the install has no `SECRETS_ENCRYPTION_KEY` (503).                                                                                                                                   |

## How it is built

- `apps/api/src/ai`: `AiSettingsService` keeps the setting and which features are off, `AiRunner` is the one way the app asks the AI anything (it checks the feature is on, reads the setting, calls the service, maps its failures, checks the answer and logs the use), `AiClient` is the one thing that talks to the services (`HttpAiClient`, faked in tests), and each feature is a task in `tasks/` (a prompt and a checked answer) used by its own service: `PolicyImportService`, `PolicyTailorService`, `PolicyCheckService` and `ProofCheckService`. `document-text.ts` reads files.
- **Speed.** Each call is logged by the API as `HttpAiClient` with the service and model, the status, the seconds it took and what it read and wrote, such as `deepseek deepseek-flash: 200, 4.2s, read 2100, wrote 340`, and never the key or the text. DeepSeek's models think at length, out of sight, before every answer unless told not to, which turns a few seconds into a minute or more; these jobs are short answers in a fixed shape, so the request for DeepSeek carries `thinking: { type: 'disabled' }` (`quietThinking` in `ai-client.ts`). No other service is sent it. If a call is slow, the log line says whether the time went on reading, writing or reasoning (`N reasoning` in the usage).
- **Timeouts.** A call to the service waits up to 120 seconds. The web server's proxy to the API waits 130 (`proxyTimeout` in `apps/web/next.config.ts`), so a slow answer comes back as `AI_FAILED` with the reason `timeout`, not as a dropped connection. Anything else between the browser and the API, such as a reverse proxy in front of an install, needs a read timeout of at least that long for the AI routes.
- One row a company in `ai_settings`, with the key sealed and the features switched off.
- Both routes that call a service keep out of the request-wide transaction, so it does not wait on the service. Saving the setting opens its own transaction after the service has answered.
- The reply is checked before it is used: it must be the JSON asked for, with the owner one of the known jobs, the title and summary cut to the form's limits, and the text no bigger than a policy may be. The text is Markdown, turned into the editor's document by `markdownToDocument` in `packages/shared`.
- Unzipping an Office file opens only the one part needed and refuses a part that would unpack past 20 MB.
