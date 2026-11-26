# Search and shortcuts

## Global search

The search box in the middle of the top bar (an icon on mobile) opens the search. **Ctrl K**, or **Cmd K** on a Mac, opens it from anywhere. Typing shows:

- **Recent:** the results opened lately, kept in this browser (`app_recent_search`), newest first, at most five. Shown when nothing is typed.
- **Quick actions:** New policy, Log a breach, Log a request, Add a vendor and, for admins, Add a person. They open the list page with its add dialog already showing (`?new=1`; see `lib/hooks/use-open-from-link.ts`). Auditors have none.
- **Pages:** every live page the person may open, matched by name. Shown when something is typed, or when there is nothing else to show.
- **Records:** from 2 letters, up to 5 of each of policies, proof requirements, vendors, breaches, requests, rules and controls, and (for admins) people. A rule and a control both open the rule page.

Pages, actions and recent results are matched in the browser. Records come from the API.

## API

| Route               | Roles                  | What it does                                                     |
| ------------------- | ---------------------- | ---------------------------------------------------------------- |
| `GET /v1/search?q=` | admin, member, auditor | A few matching records of each kind. `q` is 2 to 100 characters. |

The answer is `SearchResponse` in `packages/shared/src/search.ts`. Archived policies, proof requirements, vendors, rules and controls are left out. Everything is limited to the organisation the request is for. The search only reads, so it writes nothing to the activity log.

## Keyboard

Press **?** outside a field, or choose Keyboard shortcuts in the account menu, to see the list (`lib/shortcuts.ts`). Inside the search, the arrow keys move, **Enter** opens and **Esc** closes. Every dialog traps focus, returns it on closing, and shows a saffron ring on the element being tabbed to.
