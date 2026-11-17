# Claude and the MCP server

`apps/mcp` is an [MCP](https://modelcontextprotocol.io) server. It lets Claude set up a company's compliance work in DPDP Kit (frameworks, rules, controls, policies, proof and evidence) by calling the API with an [API key](api-keys.md). It runs on the person's own computer, so it reaches the API even when Claude's own sandbox cannot.

It adds nothing to the API. Every tool is one or two ordinary API calls, so roles, validation and the activity log apply as they do for the app.

## What Claude can do

36 tools, in four kinds:

| Kind      | Tools                                                                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Look up   | `list_people`, `get_company_answers`, `list_frameworks`, `get_framework`, `get_rule`, `list_policies`, `get_policy`, `get_policy_coverage`, `list_proof`, `get_proof_requirement`, `list_control_evidence`   |
| Add       | `create_framework`, `create_rule`, `create_control`, `create_policy`, `create_proof_requirement`, `add_evidence_link`, `add_evidence_note`, `add_evidence_file`                                              |
| Change    | `update_framework`, `update_rule`, `update_control`, `add_policies_to_control`, `update_policy_details`, `write_policy_text`, `request_policy_review`, `update_proof_requirement`, and the `restore_*` tools |
| Take away | `archive_framework`, `archive_rule`, `archive_control`, `archive_policy`, `archive_proof_requirement`, `remove_evidence`. They are marked destructive, which Claude hosts use to ask the person first.       |

Things the tools do for Claude:

- **Updates keep what is not sent.** An update tool reads the current record and sends only the fields Claude changed, so a change never blanks a field by accident.
- **Policy text is Markdown.** `write_policy_text` takes `##` sections, bullets, numbered lists, quotes, bold and italic, and turns them into the editor's JSON. `get_policy` returns the text as Markdown too.
- **Ids are checked.** An id may hold only letters, digits, `-`, `.`, `:` and `_`, so nothing can change the path of a request.
- **Failures are explained.** An API error comes back as a status, its `code` and a sentence on what it means, with a reminder to tell the person in plain words and not retry in a loop.

## What Claude cannot do

There is no tool to approve, send back or reopen a policy, to name an approver, or to make, list or revoke API keys. A person does those in the app. A key with the auditor role can only look things up.

The server tells Claude how to behave when it connects (see `src/instructions.ts`): draft and never decide, confirm before creating, use the company's own answers and not invented facts, attach only proof the person gave, and speak in plain words to a lawyer rather than a developer.

## Settings

| Variable       | What it is                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `DPDP_API_URL` | The API address. Must be `https://`, except for `localhost`, so the key is never sent in the clear. |
| `DPDP_API_KEY` | A key made under Settings, API keys. It is sent in the `x-api-key` header, to that address only.    |

The server stops at start with a message when either is missing.

## Using it in Claude Desktop

Build the extension, then give the person `apps/mcp/dpdp-kit.mcpb`:

```
pnpm --filter @dpdp-kit/mcp mcpb
```

The person opens Claude Desktop, goes to **Settings, Desktop app, Extensions, Manage**, drags the file in and clicks **Install**. A box asks for the address and the key and keeps the key on that computer. They save it, switch the extension on, and start a new conversation that is not a Code session. No Node, terminal or config file is needed from them. The release page shows each step with a screenshot (`apps/mcp/release-notes.md`, images in `docs/images/mcp`).

## Using it in Claude Code

In this repository, `.mcp.json` already declares the server. Build it, set the key, and start Claude Code here:

```
pnpm --filter @dpdp-kit/mcp bundle
export DPDP_API_KEY=...        # DPDP_API_URL defaults to http://localhost:3201
```

Claude Code asks once to approve the `dpdp-kit` server. Elsewhere, point it at the bundle:

```
claude mcp add dpdp-kit -e DPDP_API_URL=https://... -e DPDP_API_KEY=... -- node /path/to/server.mjs
```

## Building and testing

| Command                              | Does                                                              |
| ------------------------------------ | ----------------------------------------------------------------- |
| `pnpm --filter @dpdp-kit/mcp test`   | Tests the tools against a fake API, through a real MCP connection |
| `pnpm --filter @dpdp-kit/mcp bundle` | Writes `bundle/server.mjs`, one file that runs with plain Node    |
| `pnpm --filter @dpdp-kit/mcp mcpb`   | Bundles, then packs `dpdp-kit.mcpb` for Claude Desktop            |

`manifest.json` describes the extension and the two boxes Claude Desktop asks for. Tools take their limits from `packages/shared`, so they follow the API.

## Releases

The workflow `.github/workflows/mcp-release.yml` publishes the extension on its own. When a push to `main` changes `apps/mcp`, `packages/shared` or the lockfile, it tests the server, builds `dpdp-kit.mcpb` and creates a GitHub release, with the install steps from `apps/mcp/release-notes.md`, named `mcp-v<major>.<minor>.<run number>`, such as `mcp-v0.1.42`. The major and minor come from `version` in `apps/mcp/manifest.json`; raise them by hand for a bigger change.

The file is always called `dpdp-kit.mcpb`, so this link gives the newest one:

```
https://github.com/techdome-io/DPDP-Kit/releases/latest/download/dpdp-kit.mcpb
```

Claude Desktop does not update an installed extension by itself: a person downloads the new file and drags it in again.
