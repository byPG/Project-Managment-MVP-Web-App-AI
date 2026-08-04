# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A deliberately small, single-board Kanban MVP: Next.js frontend + FastAPI backend + SQLite, run via Docker Compose. Full requirements, limitations, and technical decisions live in **`backend/AGENTS.md`** — **read it before making changes**. `docs/PLAN.md` is the phased implementation plan/progress tracker for the same spec; it takes a back seat to `backend/AGENTS.md` if the two ever disagree, and should be updated after finishing a phase.

The scope is intentionally frozen: one board, exactly five fixed columns (rename only, no add/delete), cards with only a title + details (no editing after creation), fake sign-in, drag-and-drop between columns. `backend/AGENTS.md` has an extensive explicit "do not build" list (no multi-board, no real auth, no labels/priorities/comments/search/filtering/etc.) — check it before adding anything that looks like a reasonable feature, since scope creep is the main failure mode here.

**Important — there are two contradictory `AGENTS.md` files, and the root one is stale:**
- Root `AGENTS.md` describes an earlier, frontend-only design and explicitly forbids a backend, FastAPI, a database, and Docker.
- `backend/AGENTS.md` (despite its location) is the actual full-stack spec — FastAPI, SQLite/SQLModel, Docker, fake sign-in — and matches what's actually built (see `backend/main.py`, `backend/db.py`, `compose.yaml`). `docs/PLAN.md` also matches this version.

Treat `backend/AGENTS.md` as authoritative. Don't "fix" the app to match the root `AGENTS.md` (e.g. don't strip out the backend/Docker) — that file is the outdated one, despite living at the repo root where you'd expect the canonical doc.

## Commands

### Frontend (`frontend/`)

```bash
npm run dev          # start Next.js dev server (localhost:3000)
npm run lint         # eslint
npm test             # vitest run (unit/component tests)
npm run build        # production build
npm run test:e2e     # playwright e2e (auto-starts dev server)
```

Run a single Vitest test file: `npx vitest run path/to/file.test.tsx`
Run a single Playwright test: `npx playwright test e2e/kanban.spec.ts -g "test name"`

### Backend (`backend/`)

```bash
pytest                              # run all backend tests (test_main.py)
uvicorn main:app --reload --port 8000   # run backend locally without Docker
```

### Full stack (Docker)

```bash
scripts/start.sh   # or scripts/start.ps1 on Windows — docker compose up --build
scripts/stop.sh    # or scripts/stop.ps1 — docker compose down
```

Frontend: `http://localhost:3000`, backend: `http://localhost:8000`. Demo sign-in credentials: `demo@kanban.app` / `password123` (also asserted in `backend/test_main.py`).

## Architecture

### Frontend import alias points at `frontend/`, not `frontend/src/`

`tsconfig.json` and `vitest.config.ts` both map `@/*` to the **frontend root**, not `src/`. So `frontend/components/` and `frontend/lib/` (sibling to `src/`, not inside it) are the real locations for `@/components/*` and `@/lib/*`. Only the Next.js App Router entry files (`layout.tsx`, `page.tsx`, `globals.css`) and the API client (`src/lib/api.ts`) live under `src/`. Don't be misled by the split — there's one component tree, not two.

- `frontend/src/app/page.tsx` — the single page: sign-in gate, then the board. Owns all top-level state (`useReducer(boardReducer, ...)`, sign-in state, health-check status) and wires backend calls into `boardReducer` actions.
- `frontend/src/lib/api.ts` — the only place that talks to the FastAPI backend (fetch wrapper + `normalizeBoardResponse`, which converts the backend's nested board/column/card JSON into the frontend's normalized `BoardState`).
- `frontend/lib/types.ts` — shared `BoardState`/`BoardAction` types. Cards are stored normalized: `{ cards: Record<id, Card>, columns: Column[] }` where each `Column` holds `cardIds: string[]`.
- `frontend/lib/boardReducer.ts` — pure reducer for board state transitions (`setBoard`, `renameColumn`, `addCard`, `deleteCard`, `moveCard`). IDs from the backend are numeric but get stringified for frontend state.
- `frontend/components/Board.tsx` — owns the `@dnd-kit` `DndContext`, drag state, and custom collision detection (pointer-within → rect-intersection → closest-corners fallback chain). Renders `Column`/`Card`.

**Data flow for mutations**: UI action → `page.tsx` dispatches to `handleBoardAction` → calls the matching `src/lib/api.ts` function against FastAPI → on success, refetches the whole board (`refreshBoard`) and dispatches `setBoard` to resync frontend state. The backend database is the source of truth; the reducer's other action types (`renameColumn`, `addCard`, `deleteCard`) exist mainly for the same-column no-op move case and tests — most real mutations round-trip through the API rather than trusting local reducer state.

### Backend (`backend/`)

- `main.py` — all FastAPI routes and Pydantic request/response models in one file (intentionally not split into routers, per the "avoid unnecessary layers" rule in `backend/AGENTS.md`).
- `db.py` — SQLModel table models (`Board`, `Column`, `Card`), engine creation, and `seed_initial_data` (one board, five fixed columns: Backlog/To Do/In Progress/Review/Done, dummy cards). `create_db_and_tables()` seeds automatically only when the `Board` table is empty — safe to call on every startup.
- Card `position` is a 1-based integer per column, resequenced by `reorder_cards()` after delete/move so there are no gaps.
- `DATABASE_URL` env var overrides the default SQLite path (`backend/db/app.db`); tests set it to `sqlite:///:memory:` (see `test_main.py`).
- CORS is locked to `http://localhost:3000` / `127.0.0.1:3000` only.

### Docker

`compose.yaml` builds `backend` and `frontend` as separate services; the SQLite file persists in the `db_data` volume mounted at `/app/db`. `frontend` waits on the backend's healthcheck before starting.

## Working conventions from backend/AGENTS.md worth internalizing

- No `any` in TypeScript (strict mode is on); explicit types throughout.
- Immutable state updates only (see `boardReducer.ts` for the pattern to follow).
- Don't add service/repository layers, extra abstractions, or new dependencies unless a requirement genuinely needs them.
- No emojis anywhere (code, UI, comments, commit messages).
- Comments only for non-obvious *why*, never *what*.
