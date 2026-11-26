# Claude and the MCP server

`apps/mcp` is an [MCP](https://modelcontextprotocol.io) server. It lets Claude set up a company's compliance work in Neeti Bharat (frameworks, rules, controls, policies, proof and evidence) by calling the API with an [API key](api-keys.md). It runs on the person's own computer, so it reaches the API even when Claude's own sandbox cannot.

It adds nothing to the API. Every tool is one or two ordinary API calls, so roles, validation and the activity log apply as they do for the app.

## What Claude can do

44 tools, in four kinds:

| Kind      | Tools                                                                                                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Look up   | `list_people`, `get_company_answers`, `list_frameworks`, `get_framework`, `get_rule`, `list_policies`, `get_policy`, `get_policy_version`, `get_policy_coverage`, `list_proof`, `get_proof_requirement`, `list_control_evidence`                                                                                    |
| Add       | `create_framework`, `create_rule`, `create_control`, `create_policy`, `create_proof_requirement`, `add_company_answer`, `add_evidence_link`, `add_evidence_note`, `add_evidence_file`                                                                                                                               |
| Change    | `update_framework`, `update_rule`, `update_control`, `add_policies_to_control`, `update_policy_details`, `write_policy_text`, `request_policy_review`, `approve_policy`, `send_policy_back`, `reopen_policy`, `set_policy_approver`, `update_company_answer`, `update_proof_requirement`, and the `restore_*` tools |
| Take away | `archive_framework`, `archive_rule`, `archive_control`, `archive_policy`, `archive_proof_requirement`, `remove_company_answer`, `remove_evidence`. They are marked destructive, which Claude hosts use to ask the person first.                                                                                     |

Things the tools do for Claude:

- **Updates keep what is not sent.** An update tool reads the current record and sends only the fields Claude changed, so a change never blanks a field by accident.
- **Policy text is Markdown.** `write_policy_text` takes `##` sections, bullets, numbered lists, quotes, bold and italic, and turns them into the editor's JSON. `get_policy` returns the text as Markdown too.
- **Ids are checked.** An id may hold only letters, digits, `-`, `.`, `:` and `_`, so nothing can change the path of a request.
- **Failures are explained.** An API error comes back as a status, its `code` and a sentence on what it means, with a reminder to tell the person in plain words and not retry in a loop.

## What Claude cannot do

There is no tool to make, list or revoke API keys, or to touch sign-in or the AI settings. Everything else in frameworks, rules, controls, policies, proof, evidence and the company's answers can be done, with the same rules as the app:

- A built-in framework and its rules can be changed and archived like any other, while `BUILT_IN_LOCKED` in `packages/shared` is `false`. Set it to `true` to close them again.
- Approving, sending back and reopening a policy is for the named approver, or an admin when nobody is named. A key signs in as the person who made it, so it follows that rule too (otherwise `FORBIDDEN`).
- Naming an approver and changing the company's answers need an admin key. A legal limit also needs `confirmed: true`.
- A key with the auditor role can only look things up.

The server tells Claude how to behave when it connects (see `src/instructions.ts`): draft first and decide only when told, confirm before creating, use the company's own answers and not invented facts, attach only proof the person gave, and speak in plain words to a lawyer rather than a developer.

## Settings

| Variable      | What it is                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------- |
| `APP_API_URL` | The API address. Must be `https://`, except for `localhost`, so the key is never sent in the clear. |
| `APP_API_KEY` | A key made under Settings, API keys. It is sent in the `x-api-key` header, to that address only.    |

The server stops at start with a message when either is missing. The names `DPDP_API_URL` and `DPDP_API_KEY` are read too, so a setup that uses them keeps working. When both are set, the `APP_` ones win.

## Using it in Claude Desktop

Build the extension, then give the person `apps/mcp/neeti-bharat.mcpb`:

```
pnpm --filter @neeti-bharat/mcp mcpb
```

The person opens Claude Desktop, goes to **Settings, Desktop app, Extensions, Manage**, drags the file in and clicks **Install**. A box asks for the address and the key and keeps the key on that computer. They save it, switch the extension on, and start a new conversation that is not a Code session. No Node, terminal or config file is needed from them. The release page shows each step with a screenshot (`apps/mcp/release-notes.md`, images in `docs/images/mcp`).

## Using it in Claude Code

In this repository, `.mcp.json` already declares the server. Build it, set the key, and start Claude Code here:

```
pnpm --filter @neeti-bharat/mcp bundle
export APP_API_KEY=...        # APP_API_URL defaults to http://localhost:3201
```

Claude Code asks once to approve the `neeti-bharat` server. Elsewhere, point it at the bundle:

```
claude mcp add neeti-bharat -e APP_API_URL=https://... -e APP_API_KEY=... -- node /path/to/server.mjs
```

## Building and testing

| Command                                  | Does                                                              |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `pnpm --filter @neeti-bharat/mcp test`   | Tests the tools against a fake API, through a real MCP connection |
| `pnpm --filter @neeti-bharat/mcp bundle` | Writes `bundle/server.mjs`, one file that runs with plain Node    |
| `pnpm --filter @neeti-bharat/mcp mcpb`   | Bundles, then packs `neeti-bharat.mcpb` for Claude Desktop        |

`manifest.json` describes the extension and the two boxes Claude Desktop asks for. Tools take their limits from `packages/shared`, so they follow the API.

## Releases

The workflow `.github/workflows/mcp-release.yml` publishes the extension on its own. When a push to `main` changes `apps/mcp`, `packages/shared` or the lockfile, it tests the server, builds `neeti-bharat.mcpb` and creates a GitHub release, with the install steps from `apps/mcp/release-notes.md`, named `mcp-v<major>.<minor>.<run number>`, such as `mcp-v0.1.42`. The major and minor come from `version` in `apps/mcp/manifest.json`; raise them by hand for a bigger change.

The file is always called `neeti-bharat.mcpb`, so this link gives the newest one:

```
https://github.com/neetibharat/neeti-bharat/releases/latest/download/neeti-bharat.mcpb
```

Claude Desktop does not update an installed extension by itself: a person downloads the new file and drags it in again.
