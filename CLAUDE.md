# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Kanban project management app: Next.js frontend + FastAPI backend + SQLite, run via Docker Compose. Full requirements, limitations, and technical decisions live in **`backend/AGENTS.md`** — **read it before making changes**. `docs/PLAN.md` is the phased implementation plan/progress tracker for the same spec; it takes a back seat to `backend/AGENTS.md` if the two ever disagree, and should be updated after finishing a phase.

The app started as a deliberately frozen single-board MVP (`docs/PLAN.md` Parts 1-10: one board, fixed five columns, fake sign-in, no editing after card creation) and was later explicitly expanded to real user accounts and multiple personal boards per user (`docs/PLAN.md` Parts 11-19: real auth, per-user boards, column CRUD, card editing). `backend/AGENTS.md` describes the current, expanded scope and still has a "do not build" list — it's shorter now (multi-board and real auth are in scope), but board sharing/collaborators, roles beyond a single owner, and most of the original MVP's other exclusions (labels, comments, search, filtering, etc.) are still explicitly out. Check it before adding anything that looks like a reasonable feature.

**Important — there are two contradictory `AGENTS.md` files, and the root one is stale:**
- Root `AGENTS.md` describes an earlier, frontend-only design and explicitly forbids a backend, FastAPI, a database, and Docker.
- `backend/AGENTS.md` (despite its location) is the actual full-stack spec and matches what's actually built (see `backend/main.py`, `backend/db.py`, `compose.yaml`). `docs/PLAN.md` also matches this version.

Treat `backend/AGENTS.md` as authoritative. Don't "fix" the app to match the root `AGENTS.md` (e.g. don't strip out the backend/Docker, don't revert to single-board/fake-auth) — that file is the outdated one, despite living at the repo root where you'd expect the canonical doc.

## Commands

### Frontend (`frontend/`)

```bash
npm run dev          # start Next.js dev server (localhost:3000)
npm run lint         # eslint
npm test             # vitest run (unit/component tests)
npm run build        # production build
npm run test:e2e     # playwright e2e (auto-starts dev server; backend must already be running separately)
```

Run a single Vitest test file: `npx vitest run path/to/file.test.tsx`
Run a single Playwright test: `npx playwright test e2e/kanban.spec.ts -g "test name"`

### Backend (`backend/`)

```bash
alembic upgrade head                    # apply migrations (required before first run / after a schema change)
pytest                                  # run all backend tests
uvicorn main:app --reload --port 8000   # run backend locally without Docker
```

Backend tests use per-test in-memory SQLite fixtures (`conftest.py`) via `SQLModel.metadata.create_all`, not Alembic — `alembic upgrade head` is only needed for the real dev/Docker database.

### Full stack (Docker)

```bash
scripts/start.sh   # or scripts/start.ps1 on Windows — docker compose up --build
scripts/stop.sh    # or scripts/stop.ps1 — docker compose down
```

Frontend: `http://localhost:3000`, backend: `http://localhost:8000`. There's no demo/fake sign-in anymore — sign up for a real account at `/sign-up`. A demo account (`DEMO_EMAIL`/`DEMO_PASSWORD`, default `demo@kanban.app` / `password123`) is still seeded on backend startup for convenience/manual QA, but it's a real hashed-password account like any other, not a special-cased auth path.

## Architecture

### Frontend import alias points at `frontend/`, not `frontend/src/`

`tsconfig.json` and `vitest.config.ts` both map `@/*` to the **frontend root**, not `src/`. So `frontend/components/` and `frontend/lib/` (sibling to `src/`, not inside it) are the real locations for `@/components/*` and `@/lib/*`. Only the Next.js App Router entry files and the API client (`src/lib/api.ts`) live under `src/`. Don't be misled by the split — there's one component tree, not two. Components outside `src/` that need the API client import it via the `@/src/lib/api` alias path (e.g. `AuthProvider.tsx`).

### Routes

- `/` — thin client redirect based on auth status (`/boards` if signed in, `/sign-in` if not).
- `/sign-in`, `/sign-up` — real auth forms (`AuthForm.tsx`, shared between both) hitting the backend's `/api/auth/*` endpoints.
- `/boards` — board list/dashboard (`BoardList.tsx`): create, open, delete.
- `/boards/[boardId]` — the actual Kanban board for one board, keyed by the route param. A foreign or nonexistent id shows "Board not found" (via `ApiError`'s HTTP status from `src/lib/api.ts`) instead of an error.
- `/boards/layout.tsx` — auth gate (redirects anonymous users to `/sign-in`) and the shared header/sign-out button for both boards routes.

`next@` in `frontend/package.json` is newer than most training data — check `frontend/node_modules/next/dist/docs/` for the installed version's actual conventions before writing routing code (e.g. `middleware.ts` is `proxy.ts` in Next 16).

### Auth

- `AuthProvider`/`useAuth()` (`components/AuthProvider.tsx`) is a React context mounted at the root layout, holding `{ user, status, refresh, signOut }`. It calls `GET /api/auth/me` once on mount to determine sign-in state.
- Session is a JWT in an **httpOnly cookie** set by the FastAPI backend — never touched by frontend JS, never in `localStorage`. Every `fetch` in `src/lib/api.ts` sends `credentials: "include"` so the cookie round-trips; the backend's CORS config needs `allow_credentials=True` plus an explicit (non-wildcard) origin to match.
- This is a **client-side-only** auth gate — no Next.js server components or Proxy read the session. The cookie is set by the FastAPI origin (a different port than the Next.js dev server / different host in prod), so relying on it being server-readable is a dev-only illusion that breaks once frontend and backend are on genuinely different hosts.
- Session persists across a page refresh (7-day cookie) — this is a real account now, unlike the old fake sign-in which reset on refresh.

### Frontend data flow

- `src/lib/api.ts` — the only place that talks to the FastAPI backend. `fetchJson()` wraps every request with `credentials: "include"` and throws `ApiError` (carries the HTTP status) on failure. `normalizeBoardResponse()` converts the backend's nested board/column/card JSON into the frontend's normalized `BoardState`.
- `frontend/lib/types.ts` — shared `BoardState`/`BoardAction`/`BoardSummary` types. Cards are stored normalized: `{ cards: Record<id, Card>, columns: Column[] }` where each `Column` holds `cardIds: string[]`. The board id itself lives in the route (`useParams()`), not in this state — no second source of truth.
- `frontend/lib/boardReducer.ts` — pure reducer for board state transitions (`setBoard`, `renameColumn`, `addCard`, `editCard`, `deleteCard`, `moveCard`, `addColumn`, `deleteColumn`, `reorderColumns`). IDs from the backend are numeric but get stringified for frontend state. Also exports `resolveDragMove` (drag-end event → move payload) and `resolveColumnMove` (move-left/right click → full reordered id list).
- `frontend/components/Board.tsx` — owns the `@dnd-kit` `DndContext`, drag state, custom collision detection (pointer-within → rect-intersection → closest-corners fallback chain), and the trailing "add column" control. Renders `Column`/`Card`. Column reordering is move-left/move-right buttons, not drag-and-drop, to avoid extending the collision-detection logic to a second draggable type.
- `frontend/components/CardModal.tsx` — one modal, two modes (`mode: "add" | "edit"`, discriminated union props), used by both `Column.tsx` (add) and `Card.tsx` (edit). Renders as a DOM sibling of the sortable card/column, not nested inside it, so its pointer events can't bubble into dnd-kit's drag listeners.

**Data flow for mutations**: UI action → `boards/[boardId]/page.tsx` dispatches to `handleBoardAction` → calls the matching `src/lib/api.ts` function against FastAPI → on success, refetches the whole board (`refreshBoard`) and dispatches `setBoard` to resync frontend state. The backend database is the source of truth; the reducer's other action types exist mainly for the same-column no-op move case and unit tests — real mutations round-trip through the API rather than trusting local reducer state.

### Backend (`backend/`)

- `main.py` — all FastAPI routes and Pydantic request/response models in one file (intentionally not split into routers, per the "avoid unnecessary layers" rule in `backend/AGENTS.md`). Sessions are injected via `Depends(get_session)`, not created ad hoc per route.
- `auth.py` — bcrypt password hashing (`BCRYPT_ROUNDS` env-configurable; tests set it low since full-cost bcrypt is ~200-300ms/hash) and PyJWT access-token creation/decoding (HS256, `JWT_SECRET` env var).
- `db.py` — SQLModel table models (`User`, `Board`, `Column`, `Card`), engine creation, `create_board()` (board + 5 empty columns) and `create_default_board()` (board + 5 columns + dummy cards, used only for a new user's first board).
- Ownership: `get_owned_board`/`get_owned_column`/`get_owned_card` in `main.py` 404 (not 403) when a row exists but belongs to a different user, so existence can't be inferred by an attacker. Every board/column/card route goes through one of these.
- Card `position` is a 1-based integer per column, resequenced by `reorder_cards()` after delete/move so there are no gaps; `reorder_columns()` does the same for columns after a delete.
- `DATABASE_URL` env var overrides the default SQLite path (`backend/db/app.db`); tests use an isolated in-memory engine per test via `conftest.py` fixtures (not the module-level `engine`, which is only used by the running app).
- CORS is locked to `http://localhost:3000` / `127.0.0.1:3000`, with `allow_credentials=True` for the auth cookie.
- `GET /api/board` (singular) — the old single-board endpoint — is gone; use `GET /api/boards/{board_id}`.

### Migrations

Schema changes are Alembic migrations in `backend/migrations/versions/`, applied via `alembic upgrade head` (the Docker image's `CMD` runs this before starting uvicorn). `SQLModel.metadata.create_all` is test-only, used against an isolated in-memory engine in `conftest.py` — it is not how the real database gets its schema, and never has been since Part 11. When writing a migration by hand: `render_as_batch=True` is already set in `env.py` (SQLite can't `ALTER COLUMN` without it), and `sqlmodel.sql.sqltypes.AutoString()` needs `import sqlmodel` in the migration file — the most common SQLModel+Alembic mistake.

### Docker

`compose.yaml` builds `backend` and `frontend` as separate services; the SQLite file persists in the `db_data` volume mounted at `/app/db`. `frontend` waits on the backend's healthcheck before starting. Backend env vars: `DEMO_EMAIL`/`DEMO_PASSWORD` (seeded demo account), `JWT_SECRET`, `COOKIE_SECURE` (`false` for local http, must be `true` behind https in any real deployment).

## Working conventions from backend/AGENTS.md worth internalizing

- No `any` in TypeScript (strict mode is on); explicit types throughout.
- Immutable state updates only (see `boardReducer.ts` for the pattern to follow).
- Don't add service/repository layers, extra abstractions, or new dependencies unless a requirement genuinely needs them.
- No emojis anywhere (code, UI, comments, commit messages).
- Comments only for non-obvious *why*, never *what*.
- Every board/column/card route needs an ownership check (404 on mismatch) — this is easy to forget when adding a new route by copying an existing one.
- Prefer adjusting React state during render over a `useEffect` that just calls a setter (`react-hooks/set-state-in-effect` will flag the effect version) — see `CardModal.tsx` for the pattern.
