# Code Review

Date: 2026-08-04
Scope: full repository (`backend/`, `frontend/`, `scripts/`, `docs/`, root config)
Method: manual read-through of every source file, cross-referenced against `backend/AGENTS.md` (the authoritative spec — see note below) and the automated test suites, which were run and confirmed passing as of this review (13/13 backend `pytest`, 11/11 frontend `vitest`, 6/6 Playwright e2e, clean `eslint`, successful `next build`).

## How to read this document

Findings are grouped by priority. Each entry has a location, why it matters, and a recommended action. Nothing here is currently breaking the build or the passing test suites — these are correctness edges, spec deviations, and maintainability issues found by reading the code, not new automated failures.

---

## High priority

### 1. Root `README.md` doesn't meet the project's own documentation requirement
**Where:** `README.md`
**What:** The file is a single line — `demo project: The Project Managment with using AI`. `backend/AGENTS.md` (Part 10, "Documentation") explicitly requires the README to cover: project purpose, main technologies, Docker requirements, start command, stop command, local frontend URL, local backend URL, demo credentials, and test commands. None of that is present.
**Why it matters:** Anyone cloning the repo has no way to run the project without reading source code or `AGENTS.md` directly. `frontend/README.md` covers the frontend reasonably well, but there's no root-level equivalent.
**Action:** Write a minimal root `README.md` per the AGENTS.md checklist — it's a short, mechanical fix.

### 2. Demo credentials are hardcoded instead of using environment variables
**Where:** `backend/main.py:214-215` (`demo_email = "demo@kanban.app"`, `demo_password = "password123"`), duplicated again in `frontend/src/app/page.tsx:22-23` (`DEMO_EMAIL`, `DEMO_PASSWORD`)
**What:** `backend/AGENTS.md` ("Fake sign-in experience") says: *"Use environment variables for the predefined demo credentials where practical."* Both the backend and frontend hardcode the values instead, and the value is duplicated in two places with no single source of truth.
**Why it matters:** Direct spec deviation, and the duplication means updating the demo password requires touching two files that can silently drift out of sync.
**Action:** Move the credentials to a `DEMO_EMAIL`/`DEMO_PASSWORD` env var pair on the backend (with a sensible default for local dev), and have the frontend either read `NEXT_PUBLIC_DEMO_EMAIL`/`NEXT_PUBLIC_DEMO_PASSWORD` or simply stop hardcoding a default password into the input state (`useState(DEMO_EMAIL)` on `page.tsx:32` also pre-fills the email field, which is a separate minor UX choice worth reconsidering — it means the "password" field is the only thing standing between a visitor and sign-in).

### 3. SQLite database file isn't covered by the root `.gitignore`
**Where:** `.gitignore` (root)
**What:** `backend/.dockerignore` excludes `*.db`/`*.sqlite` from the Docker build context, but the root `.gitignore` has no equivalent entry. Confirmed directly: `git check-ignore backend/db/app.db` reports the path is **not** ignored.
**Why it matters:** Anyone who runs the backend locally without Docker (`uvicorn main:app`) will generate `backend/db/app.db`, which `git status` will then happily offer to track. Committing a SQLite binary (and whatever demo data a developer typed into it) is exactly the kind of accidental commit `.gitignore` exists to prevent.
**Action:** Add `backend/db/` (or `*.db`) to the root `.gitignore`.

### 4. Backend dependencies are entirely unpinned
**Where:** `backend/requirements.txt`
**What:** Every line (`fastapi`, `uvicorn[standard]`, `sqlmodel`, `pytest`, `httpx`, `email-validator`) has no version constraint, and there's no lockfile equivalent (frontend has `package-lock.json`; backend has nothing).
**Why it matters:** Every `docker compose build` resolves against whatever the latest versions are *at build time* — the same Dockerfile can produce a working image today and a broken one next month with zero code changes. This class of bug already bit this project once this session (the `httpx2` typo in this same file broke `pip install`), and unpinned versions make dependency-related breakage more likely to recur, harder to bisect, and impossible to reproduce reliably.
**Action:** Pin versions (`fastapi==0.141.1`, etc. — the versions currently resolving are visible in the Docker build log) or generate a proper lockfile (e.g. `pip freeze` into `requirements.lock.txt`, or adopt `uv`/`poetry` if that's not overkill for this project's scope).

### 5. Unrelated `.env` file with a live-looking API key sits in the project root
**Where:** `.env` (root)
**What:** Contains `OPENROUTER_API_KEY=...` under the comment "OpenRouter API Key for Digital Twin AI Chat" — a project name that doesn't match anything in this repo. Nothing in `backend/` or `frontend/` references OpenRouter or a "Digital Twin" feature.
**Why it matters:** It's correctly `.gitignore`'d, so there's no git-exposure risk today, but a credential for an unrelated project has no reason to live in this repository's working directory. If this folder is ever zipped, backed up, or shared as-is, the key travels with it.
**Action:** This is a call only you can make — if it was placed here by accident, move it to the correct project's directory (and consider rotating the key, since its current location wasn't a *secure* one even if it wasn't a *public* one). I did not modify or delete it.

---

## Medium priority

### 6. Every board mutation flashes the entire board out to a loading placeholder
**Where:** `frontend/src/app/page.tsx:88-131` (`handleBoardAction`) and `:264-270` (render)
**What:** `setIsBoardLoading(true)` runs at the top of `handleBoardAction` for every action — rename, add card, delete card, cross-column move — and while that flag is true, the render swaps out `<Board>` entirely for a plain "Loading board data…" `<div>`. Concretely: drop a card in a new column → the card (and the whole board) disappears behind a text placeholder for the duration of the move request *and* the subsequent full-board refetch, then the board remounts.
**Why it matters:** `backend/AGENTS.md` calls for a "polished, modern, responsive, professional" UI with "clear drag-and-drop feedback." A full-board unmount on every single interaction is the opposite of that — on a slower network it would be a very visible flicker, and even on localhost it's an architectural smell (the loading state should scope to the affected card/column, not the whole page).
**Action:** Track loading/error state per-action (or optimistically apply the mutation via the reducer immediately, then reconcile with the refetch) rather than swapping the whole board for a placeholder.

### 7. Same-column drag reordering half-works, then silently reverts
**Where:** `frontend/components/Board.tsx` (dnd-kit `SortableContext` per column) + `frontend/lib/boardReducer.ts` `moveCard` case + `frontend/src/app/page.tsx:114-117`
**What:** The UI fully supports dragging a card to a new position *within* the same column (dnd-kit's `SortableContext` enables it, and the reducer computes a new order). But per `backend/AGENTS.md`, reordering within a column is explicitly out of scope and there's no backend endpoint for it — so `handleBoardAction` special-cases same-column moves to update local state only (`page.tsx:114-117`) and never calls the API. The reordered position is real and visible... until the next `refreshBoard()` (triggered by *any* other action) silently snaps it back to whatever order the database has.
**Why it matters:** This isn't a spec violation (the spec says reordering isn't required), but the current behavior — "it works, until it doesn't, with no explanation" — is more confusing to a user than either fully supporting it or disabling the drag interaction within a column.
**Action:** Either persist same-column order (small addition: a `position` update on the existing move endpoint), or disable intra-column reordering in the `dnd-kit` setup so a drag-and-release within a column is a no-op instead of a temporary illusion.

### 8. Seed data's card `position` values aren't per-column, unlike everywhere else in the app
**Where:** `backend/db.py:74-83` (`seed_initial_data`)
**What:** `add_card` (`main.py:155`) and `reorder_cards` (`main.py:70-77`) both compute `position` as a 1-based counter *within a single column*. But the seed function enumerates `INITIAL_CARDS` globally (`enumerate(INITIAL_CARDS, start=1)`), so after a fresh seed, column "In Progress" holds cards with `position` 5 and 6, not 1 and 2 (verified directly against a running instance: `GET /api/board` returns exactly this).
**Why it matters:** `ORDER BY position` still produces the correct visual order today, so this isn't user-visible — but it's a latent inconsistency in what `position` is supposed to mean, and it's exactly the kind of thing that quietly breaks a future feature (e.g. anything that displays or reasons about "card N of 5 in this column").
**Action:** Compute `position` per-column in the seed loop, matching the convention used everywhere else (e.g. track a running counter per `column_position` instead of one global counter).

### 9. Inline column-rename input has no accessible label
**Where:** `frontend/components/Column.tsx:62-72`
**What:** When a user clicks the column title to rename it, it's replaced by a bare `<input>` with no `<label>`, no `aria-label`, and no `aria-labelledby` — just a `data-testid`. Contrast with `AddCardModal.tsx`, where every input correctly uses `<label htmlFor>`.
**Why it matters:** `backend/AGENTS.md`'s accessibility requirements explicitly state "associate every input with a label." A screen reader user tabbing to this input hears nothing identifying it as the column name field.
**Action:** Add `aria-label={`Rename ${column.title} column`}` (or similar) to the input.

### 10. `frontend/lib/dummyData.ts` is dead weight
**Where:** `frontend/lib/dummyData.ts`, referenced only at `frontend/src/app/page.tsx:26` (`useReducer(boardReducer, dummyBoardState)`)
**What:** The board is now gated behind sign-in, and the moment `isSignedIn` becomes true, a `useEffect` immediately fetches the real board from the backend and dispatches `setBoard`. The sign-in screen — not the board — is what's shown before that happens. So the elaborate 8-card, 5-column `dummyBoardState` is never actually rendered to a user; it exists only as the reducer's unused initial value.
**Why it matters:** This is leftover from before the backend integration landed (see `git log` — the dummy-data-only frontend predates `2da665a`). It's not broken, just dead code that could mislead a future contributor into thinking it's still load-bearing (worth noting: `Board.test.tsx` defines its own separate inline dummy state and does *not* import this file, so removing it wouldn't affect tests).
**Action:** Either delete `dummyData.ts` and initialize state with an empty board shape, or — if you want a genuine "flash of content before the API responds" — that's a legitimate reason to keep it, just worth being a deliberate choice rather than a leftover.

### 11. `boardReducer`'s mutation branches are unreachable from the real app
**Where:** `frontend/lib/boardReducer.ts` (`renameColumn`, `addCard`, `deleteCard` cases)
**What:** In production, `page.tsx`'s `handleBoardAction` always awaits the API call and then re-dispatches `setBoard` with fresh server data — it never dispatches `renameColumn`/`addCard`/`deleteCard` to the reducer directly. Those three reducer branches are exercised only by `boardReducer.test.ts` and `Board.test.tsx`, never by a real user action.
**Why it matters:** Not a bug, but a maintainability trap — a future change to, say, `addCard`'s reducer logic would pass its unit test while having zero effect on the running app, since the real code path never touches it.
**Action:** Low urgency; worth a comment in `boardReducer.ts` noting these branches are exercised by tests only and aren't part of the live mutation path (the backend is the source of truth), or consider trimming the reducer to just `setBoard` + the same-column `moveCard` case it actually uses.

### 12. Test coverage gaps against the project's own test checklist
**Where:** `backend/test_main.py`, frontend test files
**What:** `backend/AGENTS.md`'s Part 6/7 test checklists call for specific cases that aren't present:
- No backend test for renaming a **nonexistent** column (`PATCH /api/columns/999`) — the 404 path exists at `main.py:121-122` but is untested.
- No backend test for adding a card to a **nonexistent** column (`POST /api/columns/999/cards`) — the 404 path exists at `main.py:149-150` but is untested.
- No frontend test for "preventing a card without a title" (`AddCardModal`'s own validation at `AddCardModal.tsx:31-34` is untested in isolation — `Board.test.tsx` only exercises the happy path).
- No frontend test for the API error/loading state (`boardError` display at `page.tsx:259-263`) — `page.test.tsx` only mocks `/api/health` and `/api/auth/sign-in`, never a failing `/api/board`.
**Why it matters:** These are explicitly listed in the project's own spec as required coverage, and the missing 404 tests are the cheapest kind of test to add (the code path already exists and works — it just isn't asserted on).
**Action:** Add the four missing test cases; each is a few lines given the existing test patterns.

---

## Low priority / polish

### 13. Broken indentation in `handleBoardAction`'s `catch`/`finally`
**Where:** `frontend/src/app/page.tsx:126-131`
```ts
    } catch (error) {
        setBoardError(error instanceof Error ? error.message : "Unable to update board.");
      } finally {
        setIsBoardLoading(false);
      }
    }
  function dispatchAction(action: BoardAction) {
```
The `catch`/`finally` bodies are over-indented and the closing brace of the function is misaligned. Cosmetic only — `eslint` doesn't currently enforce indentation, which is how this slipped through.
**Action:** Run a formatter (e.g. `prettier`) over the file, or fix by hand.

### 14. Deprecated Pydantic API generates warnings on every backend test run
**Where:** `backend/main.py:106, 137, 167, 209` (`CardRead.from_orm(...)`)
**What:** Pydantic v2 deprecated `.from_orm()` in favor of `.model_validate()`. Currently produces ~67 `PydanticDeprecatedSince20` warnings in a single `pytest` run.
**Action:** Replace `CardRead.from_orm(card)` with `CardRead.model_validate(card)` (already have `model_config = ConfigDict(from_attributes=True)` set, so this is a drop-in swap).

### 15. Duplicated CSS rule
**Where:** `frontend/components/Column.module.css:164-174`
**What:** The `.addIcon` rule block is repeated verbatim twice in a row.
**Action:** Delete the duplicate.

### 16. Minor backend duplication building `ColumnRead`
**Where:** `backend/main.py` — `get_board` (`:96-108`) and `rename_column` (`:129-138`) both re-query a column's cards and hand-assemble an identical `ColumnRead`.
**Action:** Optional — a small `build_column_read(column, session) -> ColumnRead` helper would remove the duplication if the endpoint count grows further; at the current size it's a matter of taste.

### 17. Decorative icons aren't marked `aria-hidden`
**Where:** SVG icons in `Card.tsx`, `Column.tsx`, `AddCardModal.tsx`
**What:** None of the inline `<svg>` icons have `aria-hidden="true"`. Low impact since every icon-only button already has a correct `aria-label` on the button itself (e.g. `aria-label="Delete card"`), but it's a one-line best practice to prevent assistive tech from ever trying to describe the icon itself.
**Action:** Add `aria-hidden="true"` to the decorative `<svg>` elements.

### 18. No length limits on user-entered text
**Where:** `backend/main.py` (`ColumnRenameRequest.title`, `AddCardRequest.title`/`details`)
**What:** No `max_length` constraint on any of the free-text fields.
**Why it matters:** Low risk for a local-only demo app, but worth a one-line Pydantic `Field(max_length=...)` if this is ever exposed beyond localhost.

---

## What's working well

Worth stating explicitly, since a review that only lists problems is misleading about the overall state of the code:

- **Test suite is comprehensive and now fully green** (13 backend, 11 frontend unit/component, 6 e2e) after this session's fixes.
- **CORS is correctly scoped** to the two local frontend origins rather than a wildcard.
- **Color scheme in `globals.css`** matches the approved palette in `backend/AGENTS.md` exactly, custom-property by custom-property.
- **dnd-kit SSR-safety pattern** (`useIsMounted` via `useSyncExternalStore` in `Board.tsx`) is a correct, idiomatic way to avoid hydration mismatches with a client-only drag library.
- **Immutable state updates** throughout `boardReducer.ts` — no direct mutation anywhere.
- **Backend input validation** is consistent: every mutating endpoint validates and returns the right HTTP status codes (400 for bad input, 404 for missing resources).
- **Icon-only buttons have `aria-label`s** (delete card, close modal) — the accessibility gap noted above (#9, #17) is about the few remaining gaps, not a systemic absence.
- **Scope discipline**: skimmed the diff against `backend/AGENTS.md`'s long "do not build" list and found no scope creep — no extra endpoints, no unrequested features.

---

## Suggested order of work

1. Root `README.md` (#1) — quick, high value.
2. `.gitignore` fix for `backend/db/` (#3) — one line.
3. Pin backend dependencies (#4).
4. Move demo credentials to env vars (#2).
5. Add the four missing test cases (#12).
6. Fix the loading-state UX (#6) — the largest single piece of work here, but the most user-visible.
7. Everything else, at your discretion — none of it is blocking.

(#5, the stray `.env`, is intentionally left off this list — it's a decision for you, not an engineering task.)
