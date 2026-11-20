# Design system

See it live at `/en/design-system` while `pnpm dev` runs. It shows every token and component with its sizes and states. It is a 404 in production.

## How it is built

- **Tailwind v4.** There is no `tailwind.config`. Tokens live in `apps/web/src/styles/theme.css`.
- **react-aria-components** gives each component its keyboard handling, focus and screen-reader behaviour. We only add the look.
- **Tabler icons** (`@tabler/icons-react`). Pass the icon component itself, for example `iconLeading={IconPlus}`.
- **Fonts:** Geist for text and Geist Mono (`font-mono`) for keys, codes and other technical values, loaded with `next/font` in `app/[locale]/layout.tsx`.
- **Motion:** [motion](https://motion.dev) (`motion/react`). Easing and keyframes for CSS animations live in `theme.css`; `MotionProvider` makes every animation respect "reduce motion".

## Tokens

There are two layers, both in `theme.css`.

1. **Primitives** are raw scales: `brand-700`, `gray-200`, `accent-500`. Components never use them.
2. **Semantic tokens** say what a colour is for: `bg-brand`, `text-fg-muted`, `border-line`, `bg-danger-soft`. Components use only these.

To restyle the product, change the semantic layer. Nothing else needs touching.

| Kind     | Tokens                                                                      |
| -------- | --------------------------------------------------------------------------- |
| Surfaces | `page`, `surface`, `surface-muted`, `line`, `line-strong`                   |
| Text     | `fg`, `fg-muted`, `fg-subtle`                                               |
| Brand    | `brand`, `brand-hover`, `brand-soft`, `brand-line`, `accent`, `accent-soft` |
| Status   | `success`, `danger`, `info`, each with a `-soft` background                 |
| Type     | `text-display`, `heading`, `title`, `subtitle`, `body`, `label`, `caption`  |
| Shape    | `rounded-control` (buttons, fields), `rounded-card`                         |
| Shadow   | `shadow-xs`, `shadow-popover`                                               |
| Focus    | the `focus-ring` utility: one saffron ring everywhere                       |

## The look

Soft and spacious, with the depth coming from shadow, not borders.

- **Page and cards.** A soft grey page (`bg-page`), white cards with a large radius (`rounded-card`, 1.5rem), a barely visible border and the `shadow-card` shadow. Cards get `p-6`.
- **Pills.** Buttons and chips are fully rounded, and primary buttons are a dark pill with a little gloss on the top edge (`shadow-pill`). Sidebar items are not pills: they are small rounded squares, and the active one is a light brand tint (`bg-brand-soft`, `text-brand`). Light pills (`Button color="soft"`, the delta chip) lift off the page with `shadow-soft`.
- **Big numbers.** Page titles use `text-hero` and key figures use `text-stat`, both at weight 500 with tight tracking. Use `tabular-nums` on figures so digits line up.
- **Contrast is not negotiable.** Keep labels and muted text at `fg-muted` or `fg-subtle`. Do not go paler than that to look airy: this is a compliance product and people must be able to read it.
- **Skip** glass and blur effects: they cost performance and make text harder to read.
- **On a brand fill.** White text on a brand-coloured fill (a primary button) uses the `on-brand*` tokens. Chart colours, including the gauge ring and its track, come from the `chart-*` tokens. Neither is written as a raw value.

Use the scale in `theme.css`: `caption`, `label`, `body`, `subtitle`, `title`, `heading`, `display`. Pick one of three weights and nothing else:

| Weight                | Use                                                |
| --------------------- | -------------------------------------------------- |
| 400 (`font-normal`)   | Body text                                          |
| 500 (`font-medium`)   | Labels, navigation, table text that needs emphasis |
| 600 (`font-semibold`) | Headings, buttons, badges                          |

No `font-bold` or `font-extrabold`: they look heavy and uneven.

## Dark theme

The dark theme is the same semantic tokens with other values, in one block at the end of `theme.css` (`:root[data-theme='dark']`). Components use only the semantic layer, so they need nothing of their own; a new token needs a dark value in that block.

- **Choice:** Appearance in the account menu is System, Light or Dark, kept in this browser under `dpdp_theme` (`lib/theme.ts`, `lib/hooks/use-theme.ts`). System follows the device and changes with it.
- **No flash:** a small script in the page head (`THEME_BOOT_SCRIPT`) sets `data-theme` on `<html>` before anything paints, which is why `<html>` carries `suppressHydrationWarning`.
- **On a brand fill** (buttons, tooltips) the text is `on-brand`, which is white in the light theme and the dark page colour in the dark one.

## Motion

- Use motion for things that move between states: the sliding active item in the sidebar, page entry, anything that needs layout animation.
- Use the CSS animations from `theme.css` (`animate-fade-in`, `animate-slide-in-left`, `animate-pop-in`) for overlays and drawers. React Aria adds `entering:` and `exiting:` variants for them.
- Keep it short and quiet: 150 to 250 ms, no bounce. Never animate something just because you can.

## Rules

- No raw values in feature code: no `text-[13px]`, `rounded-[9px]`, `#1e3a5f` or `bg-gray-100`. If a token is missing, add it to `theme.css` first.
- Feature code composes components from `components/base/`. It does not restyle them with long class lists. A one-off layout class such as `self-start` or `w-full` is fine.
- Merge classes with `cx()` from `@/lib/utils/cx`, so the last class wins. `cx()` knows our tokens; when you add a text size, radius or shadow token, add it to `cx.ts` too, and its test will tell you if you forgot.

## App shell and navigation

The shell is a slim, two-part sidebar: a rail of icons (one per area) beside a panel that lists the pages of the selected area. Settings is one more area, so it needs no menu inside the page.

- **The map lives in one file:** `lib/navigation.ts` lists the areas, their sections and their pages. To ship a module, build its page and change its `status` from `'soon'` to `'live'`. To add a page, add one line there, a route file, and its labels in `messages/en.json`. A test fails if any of the three is missing.
- **The pieces** are in `components/shell/sidebar/`, one job per file: `sidebar.tsx` (puts it together), `rail.tsx` and `rail-button.tsx` (the icons), `panel.tsx` (the pages), `nav-item.tsx` (one row, with its "Soon" state) and `use-selected-area.ts` (which area the panel shows).
- **Mobile** shows the same sidebar as a drawer, opened from the top bar.
- **The top bar** (desktop) holds the global search in the middle and the bell and account menu at the right. On mobile the search is an icon and the bell and account menu sit in the mobile bar.
- A module that is not built yet uses `comingSoon('<id>')` as its page; replace it when the module ships.

## Components

All live in `apps/web/src/components/base/<name>/<name>.tsx`.

| Component                                               | Notes                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                                                | `color`: primary, secondary, soft, tertiary, danger. `size`: sm, md, lg. `iconLeading`, `isIconOnly` (give it an `aria-label`), `isLoading`, `isDisabled`.                                                                                                                                                  |
| `Input`, `Textarea`                                     | `label`, `hint`, `error`, `placeholder`. Pass already-translated text.                                                                                                                                                                                                                                      |
| `Select`                                                | Generic over the id type: `options` of `{ id, label }`, and `onSelectionChange` gets that id type back.                                                                                                                                                                                                     |
| `DropZone`                                              | A dashed place to drop files, with a button for the file picker that keyboard users reach: `label`, `hint`, `buttonLabel`, `loadingLabel`, `accept` (extensions with a dot) and `onFiles`, which gets the dropped or chosen files. `isLoading` shows a spinner and the loading label; `isDisabled` dims it. |
| `Checkbox`, `Switch`                                    | Children are the label.                                                                                                                                                                                                                                                                                     |
| `Badge`                                                 | `color`: gray, brand, success, warning, danger.                                                                                                                                                                                                                                                             |
| `Alert`                                                 | `tone`: info, success, error. A banner with the card radius (`rounded-card`), so it lines up with the cards around it.                                                                                                                                                                                      |
| `Card`, `PageHeader`                                    | Page structure. `Card` takes `variant` (default, dashed), `padding` (none, sm, md) and `as` (section, aside).                                                                                                                                                                                               |
| `SettingCard`                                           | One setting on its own card: `title`, `description`, the field as children, a footer `hint` on the left and an `action` (usually Save) on the right. Use it for every simple settings page.                                                                                                                 |
| `StatCard`, `DeltaChip`, `ProgressBar`, `HighlightCard` | Dashboard pieces. `StatCard`: a label, one large figure, a delta chip, and room for a breakdown below. `ProgressBar`: a solid bar with a label and a figure. `HighlightCard`: the one highlighted card on a page, white with a large brand-coloured figure.                                                 |
| `Tabs`, `Table`                                         | `Tabs` is uncontrolled, or controlled with `selectedKey` and `onSelectionChange`. `Table` is composed from `TableHeader`, `TableColumn`, `TableBody`, `TableRow`, `TableCell`.                                                                                                                              |
| `SegmentedControl`                                      | A pill of two or three choices where one is on, such as Board or List: `options` of `{ id, label }`, `value`, `onChange` and an `aria-label`. Use it to switch how the same data is shown; use `Tabs` for different content.                                                                                |
| `Modal`, `Tooltip`                                      | `Modal` takes a `trigger` and a children function that receives `close`.                                                                                                                                                                                                                                    |
| `ConfirmDialog`                                         | "Are you sure?" for removing or hiding something: a `trigger`, `title`, `confirmLabel` and `onConfirm`, which returns the mutation result. It stays open and shows the error when the result holds one.                                                                                                     |
| `FormActions`                                           | The row under a form: Cancel and Submit on the right, an optional `extra` on the left.                                                                                                                                                                                                                      |
| `Pagination`                                            | "26–50 of 112" with Previous and Next. Renders nothing when everything fits on one page.                                                                                                                                                                                                                    |
| `Loading`                                               | A turning spinner in the middle of a page or card while its data loads.                                                                                                                                                                                                                                     |
| `StatTile`                                              | A small card with one figure, a label and an optional note. `tone` colours a figure above zero.                                                                                                                                                                                                             |
| `HeroPanel`, `HeroFacts`, `HeroFact`, `RingGauge`       | The readiness card: a white card with a brand-coloured ring that fills to a percentage, a heading and a row of figures.                                                                                                                                                                                     |
| `IconLinkRow`, `AttentionList`                          | A bordered link row with a toned icon tile, a title and a subtitle; and a titled card of such rows with an empty state and a "more" note.                                                                                                                                                                   |
| `Avatar`, `BrandMark`, `EmptyState`                     | Identity and empty screens.                                                                                                                                                                                                                                                                                 |

## Charts

Every chart is drawn by hand with `d3-shape` and `d3-scale` as plain SVG, in `apps/web/src/components/graphs/`. There is no chart library, so a chart can look like the rest of the product and is not limited by what a library offers. A chart in this folder knows nothing about the page it sits on: it takes numbers and colours, and the page gives it both.

| Chart         | What it draws                                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RingGauge`   | A ring that fills to a percentage, for the readiness card.                                                                                                                      |
| `StackedBars` | Rows of bars, each split into coloured parts, with a key and a tooltip on each part.                                                                                            |
| `TickRamp`    | A scale as a rising ramp of ticks, one per point, coloured by band. Ticks up to one value are solid and those up to another are hatched, with a pill over each marked tick.     |
| `ContourMap`  | A square map of two scales, with smooth bands where their product crosses from one level to the next, and dots on it. With two dots, an arrow shows which way the second moved. |

Colours come from the theme, such as `var(--color-chart-approved)` or `var(--color-risk-high)`, never raw values. A chart that fills or counts up does so with `motion`, and shows its final state at once for a person who has asked for less motion. `useWidth` gives a chart the width it has been given, and keeps it up to date as the space changes.

## Adding a component

1. Build it on the matching react-aria-components primitive when it is interactive.
2. Use only semantic tokens, and `cx()` to merge `className`.
3. Keep it under the lint limits (40 lines per function). Split into small parts.
4. Take already-translated strings as props. Only `Pagination` and `ConfirmDialog` carry fixed words of their own (the `pagination` and `confirm` message groups).
5. Add it to `app/[locale]/design-system/sections.tsx` with its sizes and states, then update the table above.

The style guide page is the one exception to the rule against hard-coded text: its demo copy is English on purpose.
