# Deviations from `SYSTEM_DESIGN_ADMIN_DASHBOARD.md`

The design doc describes `@astryxdesign/*` **0.1.4** with mock data. This app uses **0.7.0** and a real API.
`npx astryx component <Name>` / `npx astryx docs tokens` are the source of truth when they disagree with the doc.
Everything not listed here follows the doc as written (shell, `ROUTES`, `NAV_SECTIONS`, page patterns A–D,
`DataTable`/`TableToolbar`/`StatusLabel`, `useImperativeAlertDialog` deletes, toasts on every mutation,
i18n en/vi with `enumLabel`, `@/lib/format`, heroicons only, no layout `<div>`s).

## Agreed deviations (PROMPT.md §0)

| #   | Doc rule                                 | What we do instead                                                                                                                                                                           | Why                     |
| --- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1   | §23.19 mock data in `features/*/data.ts` | Real API via TanStack Query. Data flows through `features/*/api.ts` (+ `lib/resource.ts` factory); components never call `fetch`.                                                            | Real backend            |
| 2   | §13 no validation library                | zod schemas from `@portfolio/shared` → `lib/validation.ts` `fieldErrors()` → translated messages. Errors are still derived every render and only shown after a failed submit (`showErrors`). | Same rules as the API   |
| 3   | §20 mock auth in `localStorage`          | JWT login, token in `sessionStorage`; any 401 clears it and shows "Session expired"; token expiry is also enforced client-side.                                                              | Real auth (PROMPT §5.3) |
| 4   | §22 no tests                             | vitest + Testing Library (`test/`)                                                                                                                                                           | PROMPT requirement      |

## Version drift 0.1.4 → 0.7.0

| Item                       | Doc (0.1.4)                | 0.7.0                                                                                                                                                           |
| -------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Theme import               | `@astryxdesign/core/Theme` | `@astryxdesign/core/theme`                                                                                                                                      |
| Side-nav collapse          | on `AppShell`              | `SideNav collapsible={{ isCollapsed, onCollapsedChange }}`                                                                                                      |
| Heading                    | —                          | `@astryxdesign/core/Heading` (separate entry point)                                                                                                             |
| Stacks                     | `Stack`                    | `HStack` / `VStack` entry points, `StackItem` from `Stack`                                                                                                      |
| `Toolbar`                  | `label` optional           | `label` is required — always passed a translated string (fixes doc §26.14)                                                                                      |
| `Selector` with `hasClear` | `value?: string`           | `value: string \| null`                                                                                                                                         |
| Table sorting              | column flag implicit       | `TableColumn.sortable: true` + `useTableSortable`                                                                                                               |
| Peer dependency            | —                          | `@stylexjs/stylex` 0.19.x declared explicitly                                                                                                                   |
| Component count            | 149                        | 168 — `TextArea`, `FileInput`, `Thumbnail`, `TabList`/`Tab`, `Tokenizer`, `DateInput`, `Banner`, `Field` now exist and are used instead of hand-rolled controls |

## Structural changes

| #   | Change                                                                                                                                               | Reason                                                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5   | `createBrowserRouter` + `RouterProvider` instead of `<BrowserRouter><Routes>` (same route tree, created on mount)                                    | `useBlocker` (unsaved-changes warning in the blog editor) only works with a data router                                                                     |
| 6   | Provider order: `LinkProvider > ToastViewport > AuthProvider` (doc: Auth outside ToastViewport)                                                      | `AuthProvider` toasts "session expired" and needs the viewport above it                                                                                     |
| 7   | Form dialogs reset by **remounting** (`{isOpen && <XFormDialogBody key={entity?.id ?? "new"} />}`) instead of `useEffect(() => setX(...), [isOpen])` | The doc's reset effect violates `react-hooks/set-state-in-effect` (eslint-plugin-react-hooks 7). Same behaviour: fields start from the entity on every open |
| 8   | `SettingsSection` promoted to `components/common/`                                                                                                   | Used by Sections, Profile, Blog editor and Settings (doc §21: promote when a second page needs it)                                                          |
| 9   | `DataTable` gained `isLoading` / `error` / `onRetry`                                                                                                 | Data is fetched; doc §14 lists loading/error as a gap. Uses the router's `Spinner` idiom and `EmptyState`                                                   |
| 10  | No `NotificationsMenu`; unread count is a `Badge` on the Messages nav item (`NavItem.hasInboxBadge`)                                                 | Inbox is the only notification source (PROMPT §7.2)                                                                                                         |
| 11  | Content dialogs with markdown / media (Project, Experience) use `width={720}`, Achievement `560` (doc: 440/480)                                      | Too many fields for 480; still a single dialog per entity                                                                                                   |
| 12  | Blog editor is a page (`/blog/new`, `/blog/:id`), not a dialog                                                                                       | Long-form content (PROMPT §7.2). First route params in the app (doc §26.23)                                                                                 |
| 13  | Dashboard chart is a bar chart of contact messages / day (new `messagesPerDay` from `/admin/dashboard`)                                              | Only time series the portfolio has                                                                                                                          |
| 14  | `Card` grid in `MediaPage` instead of `DataTable`                                                                                                    | Media is a gallery (doc §15 allows Card for galleries)                                                                                                      |

## Custom components (not in Astryx)

| Component                                                   | Built from                                                                                      | Why custom                                                                                                                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/common/MediaPicker.tsx` (+ `MediaPickerDialog`) | `Field`, `Thumbnail`, `Dialog`, `TabList`, `Pagination`, `UploadForm` (`FileInput`)             | Pick-from-library-or-upload is app-specific (searched: `npx astryx search "file upload"` → only `FileInput`)                                                                 |
| `components/common/MarkdownEditor.tsx`                      | `TabList`, `TextArea` (ref for caret), `Card`, `@portfolio/markdown`                            | Preview must use the **public site's** renderer (PROMPT §7.2); Astryx `Markdown` is a different renderer                                                                     |
| `components/common/TagsInput.tsx`                           | `Tokenizer` with `hasCreate` and a static search source                                         | Thin adapter: string[] ↔ `SearchableItem[]`                                                                                                                                  |
| `components/common/DialogFrame.tsx`                         | Astryx `Layout` + `LayoutContent` + `LayoutFooter` (the 0.7.0 `DialogScrollingContent` pattern) | The doc's `Dialog > VStack` layout clips long forms in 0.7.0 (the dialog is a flex container); this keeps header/actions pinned and scrolls the middle. Used by every dialog |

## Escape hatches

- `styles/tailwind.css` contains `.md-preview` rules (token-only `var(--…)`) for the markdown preview: the shared
  renderer outputs plain HTML that no Astryx component styles. The only `className` in `src/` is on that renderer.
- `DashboardPage` passes `var(--token, #fallback)` colours to recharts (doc §26.10 precedent).
- `LanguageMenu` icon uses `style={{ width: 16, height: 16 }}` (doc §17 precedent).
