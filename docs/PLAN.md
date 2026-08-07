# High level steps for project

This document defines the implementation order for the Project Management MVP Web Application.

The application will use:

- Next.js
- TypeScript
- FastAPI
- SQLite
- SQLModel
- Docker Compose
- CSS Modules
- dnd-kit
- automated frontend and backend tests

Do not skip a part unless all of its tasks and success criteria are already complete.

Parts 1-10 delivered the frozen-scope single-board MVP described above. Parts 11-19 deliver a later, explicitly user-approved multi-user, multi-board expansion (real accounts, personal boards, custom columns, card editing); see the updated `backend/AGENTS.md` for the current business requirements and limitations, which supersede the single-board scope wherever the two disagree.

## Part 1: Plan

### Tasks

- Review `AGENTS.md`.
- Review this `docs/PLAN.md` document.
- Inspect the existing repository structure.
- Confirm the required frontend, backend, database, Docker, and testing technologies.
- Confirm the MVP business requirements.
- Identify the smallest required API.
- Identify the smallest required database model.
- Confirm the implementation order.
- Record important technical decisions in this document.

### Technical decisions

- Use Next.js with TypeScript for the frontend.
- Use FastAPI for the backend.
- Use SQLite as the database.
- Use SQLModel for database models and access.
- Use Docker Compose for local development.
- Use one Docker service for the frontend.
- Use one Docker service for the backend.
- Do not create a separate database container.
- Store the SQLite file in a Docker volume.
- Use a fake sign-in flow without production authentication.
- Use exactly one board with exactly five columns.

### Success criteria

- The project scope is clear.
- Docker is included as a mandatory project requirement.
- The backend architecture is defined.
- The database solution is defined.
- The frontend architecture is defined.
- The required API operations are identified.
- No unnecessary functionality is planned.

## Part 2: Scaffolding

Set up the Docker infrastructure, the backend in `backend/` with FastAPI, and write the start and stop scripts in the `scripts/` directory. This should serve example static HTML to confirm that a Hello World example works running locally and also make an API call.

### Tasks

Create the initial project structure:

```text
project-root/
├── backend/
├── docs/
├── scripts/
├── compose.yaml
├── .gitignore
├── AGENTS.md
└── README.md
```

Create the FastAPI backend inside `backend/`.

The backend must initially provide:

```text
GET /api/health
```

The endpoint should return a small JSON response confirming that the API is running.

Example:

```json
{
  "status": "ok"
}
```

Create temporary example static HTML served by FastAPI.

The page must:

- display a Hello World message
- call `GET /api/health`
- display the returned API status
- make it clear when the API request fails

Create:

```text
backend/Dockerfile
backend/.dockerignore
compose.yaml
```

Create the required scripts:

```text
scripts/start.sh
scripts/stop.sh
scripts/start.ps1
scripts/stop.ps1
```

The start scripts must use:

```bash
docker compose up --build
```

The stop scripts must use:

```bash
docker compose down
```

Add a backend health check to the Docker Compose configuration.

Expose the backend on:

```text
http://localhost:8000
```

### Tests

Add a backend test for:

```text
GET /api/health
```

### Success criteria

- Docker Compose builds successfully.
- The backend container starts successfully.
- FastAPI runs inside Docker.
- The static Hello World page loads locally.
- The static page successfully calls the health endpoint.
- The health endpoint returns the expected JSON.
- The backend health check passes.
- The start and stop scripts work.
- The backend test passes.
- No frontend framework has been added yet.

## Part 3: Add in Frontend

### Tasks

Create the Next.js application inside:

```text
frontend/
```

Configure:

- Next.js
- App Router
- TypeScript
- ESLint
- the `src/` directory
- the `@/*` import alias
- CSS Modules
- Vitest
- React Testing Library
- Playwright

Do not use:

- Tailwind CSS
- a UI component framework
- Redux
- Zustand
- MobX

Create:

```text
frontend/Dockerfile
frontend/.dockerignore
```

Update `compose.yaml` to run:

- the frontend service
- the backend service

Expose the frontend on:

```text
http://localhost:3000
```

Configure the API URL through:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Replace the temporary FastAPI HTML page as the main user interface with the Next.js frontend.

Create a simple frontend page that:

- displays a Project Management MVP heading
- calls the FastAPI health endpoint
- displays the backend connection status

### Tests

Add frontend tests that verify:

- the page renders
- the API connection status is displayed

### Success criteria

- The frontend runs inside Docker.
- The backend continues to run inside Docker.
- The frontend loads at `http://localhost:3000`.
- The frontend successfully calls the backend.
- CORS is configured correctly.
- The Next.js application builds successfully.
- Frontend tests pass.
- Docker Compose starts the full frontend and backend environment.

## Part 4: Add in a fake user sign in experience

### Tasks

Create a simple fake sign-in page.

The sign-in page should contain:

- an email input
- a password input
- a sign-in button
- visible demo credentials
- basic validation
- an error message for invalid credentials

Create a backend endpoint:

```text
POST /api/auth/sign-in
```

The endpoint should:

- accept an email and password
- compare them with predefined demo credentials
- return a predefined demo user when credentials are correct
- return an appropriate error when credentials are incorrect

Do not implement:

- registration
- access tokens
- refresh tokens
- OAuth
- cookies
- password hashing infrastructure
- database sessions
- production authentication

After a successful sign-in:

- store the demo user in frontend React state
- display the application area
- allow the sign-in state to reset after a page refresh

### Tests

Backend tests:

- successful fake sign-in
- rejected fake sign-in

Frontend tests:

- sign-in form renders
- required fields are validated
- successful sign-in opens the application area
- invalid credentials display an error

### Success criteria

- The fake sign-in page works.
- Valid demo credentials allow access.
- Invalid credentials are rejected.
- The sign-in request is handled by FastAPI.
- No production authentication system has been introduced.
- Tests pass.

## Part 5: Database modeling

### Tasks

Add SQLite and SQLModel to the backend.

Create the minimum database models.

### Board model

Fields:

```text
id
name
```

### Column model

Fields:

```text
id
board_id
name
position
```

### Card model

Fields:

```text
id
column_id
title
details
position
```

Use foreign keys to connect:

- columns to the board
- cards to columns

Create database initialisation logic.

When the database is empty, automatically create:

- one board
- exactly five columns
- initial dummy cards

Suggested initial column names:

1. Backlog
2. To Do
3. In Progress
4. Review
5. Done

Store the SQLite database file in a path mounted to a Docker volume.

Update Docker Compose to preserve the database between container restarts.

Do not create:

- multiple boards
- a user table
- authentication tables
- labels
- comments
- attachments
- activity history
- unnecessary timestamps unless they are used by the application

### Tests

Add tests that verify:

- the database is created
- one board is seeded
- exactly five columns are seeded
- dummy cards are seeded
- seeding is not duplicated after another application start

### Success criteria

- SQLite is connected to FastAPI.
- SQLModel models are created.
- Database tables are created automatically.
- Initial data is seeded only when required.
- Exactly one board exists.
- Exactly five columns exist.
- The database persists through the Docker volume.
- Database tests pass.

## Part 6: Backend

### Tasks

Implement the minimum backend API required by the application.

### Load the board

```text
GET /api/board
```

The response must contain:

- board ID
- board name
- exactly five columns
- column IDs
- column names
- column positions
- cards assigned to each column
- card IDs
- card titles
- card details
- card positions

### Rename a column

```text
PATCH /api/columns/{column_id}
```

Requirements:

- accept a new column name
- reject an empty name
- update only the selected column
- preserve its ID and position

### Add a card

```text
POST /api/columns/{column_id}/cards
```

Requirements:

- require a title
- allow optional details
- create a unique card ID
- add the card to the end of the selected column

### Delete a card

```text
DELETE /api/cards/{card_id}
```

Requirements:

- delete only the selected card
- return an appropriate response when the card does not exist

### Move a card

```text
PATCH /api/cards/{card_id}/move
```

Requirements:

- accept the destination column ID
- remove the card from its previous column
- add it to the end of the destination column
- update its position
- reject invalid card or column IDs

Do not add endpoints for:

- creating boards
- deleting boards
- creating columns
- deleting columns
- editing cards
- searching
- filtering
- archiving

### Tests

Add backend tests for:

- loading the board
- renaming a column
- rejecting an empty column name
- adding a card
- rejecting a card without a title
- deleting a card
- moving a card
- invalid board, column, and card operations

### Success criteria

- All required endpoints are implemented.
- API input is validated.
- Appropriate HTTP status codes are returned.
- Database updates persist.
- No unnecessary endpoints have been added.
- Backend tests pass.

## Part 7: Frontend + Backend

### Tasks

Connect the Next.js frontend to the FastAPI backend.

Create the application foundation:

- global colour variables
- global typography
- CSS reset
- application layout
- loading state
- error state

Create the minimum component structure.

Suggested components:

```text
KanbanBoard
KanbanColumn
TaskCard
AddCardForm
RenameColumnForm
SignInForm
```

Only create additional components when they provide a clear benefit.

Implement:

- loading the board from the backend
- rendering one board
- rendering exactly five columns
- rendering initial cards
- renaming a column
- adding a card
- deleting a card
- updating the interface after every successful API request
- displaying understandable API errors

Do not store the canonical board data only in hardcoded frontend state.

The backend database is the source of truth.

### Tests

Add frontend tests for:

- rendering the loaded board
- rendering exactly five columns
- rendering cards
- renaming a column
- adding a card
- preventing a card without a title
- deleting a card
- API loading and error states

### Success criteria

- The frontend loads board data from FastAPI.
- Exactly five columns are displayed.
- Dummy cards are displayed.
- Column changes are persisted through the backend.
- New cards are persisted through the backend.
- Deleted cards are removed from the database.
- Expected API errors are shown clearly.
- Frontend tests pass.

## Part 8: Drag and drop

### Tasks

Install and configure:

```text
@dnd-kit/core
```

Add `@dnd-kit/sortable` only when required.

Implement drag-and-drop for moving cards between columns.

When a card is dropped:

1. Identify the card.
2. Identify the destination column.
3. Send the move request to FastAPI.
4. Update the interface after a successful response.
5. Restore or refresh the previous state when the request fails.

Requirements:

- cards can be moved between columns
- moved cards are appended to the destination column
- cards are removed from the original column
- duplicate cards are not created
- card title and details are preserved
- valid drop targets are visually highlighted
- the dragged card has clear visual feedback

Reordering cards within the same column is not required.

### Tests

Add tests for the pure card-move logic where practical.

Add backend integration coverage for moving cards.

Add a Playwright drag-and-drop test when it can be implemented reliably without unnecessary complexity.

### Success criteria

- Cards can be moved between columns.
- The backend database is updated.
- The frontend reflects the updated board.
- No duplicate card is created.
- No card data is lost.
- Drag feedback is visible.
- Move-related tests pass.

## Part 9: UI, responsiveness and accessibility

### Tasks

Apply the approved colour scheme.

Use CSS custom properties for:

- application background
- surfaces
- buttons
- text
- borders
- status and danger states

Create a polished interface using:

- consistent spacing
- clear typography
- moderate corner rounding
- subtle borders
- restrained shadows
- clear hover states
- visible focus states
- clear drag-and-drop feedback

Responsive requirements:

- the application must work on desktop, tablet, and mobile
- columns should appear next to each other when space allows
- the board should scroll horizontally on smaller screens
- every column should retain a readable minimum width
- forms must fit within the mobile viewport
- interactive elements must be usable on touch screens

Accessibility requirements:

- use semantic HTML
- associate every input with a label
- add accessible names to icon-only buttons
- use native buttons for actions
- maintain sufficient contrast
- show visible keyboard focus
- do not rely only on colour to communicate meaning
- provide useful form and API error messages
- do not use emojis as icons

### Tests

Add accessibility-oriented component checks where appropriate.

Use Playwright to verify the main layout at representative viewport sizes.

### Success criteria

- The interface follows the approved colour scheme.
- The interface is consistent and professional.
- The board is usable on desktop and mobile.
- Horizontal scrolling works where required.
- Forms remain usable on smaller screens.
- Keyboard focus is visible.
- Inputs have labels.
- Icon-only buttons have accessible names.
- No major overflow or contrast issues remain.

## Part 10: Testing, final verification and delivery

### Automated testing

Run frontend checks:

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

Run backend checks:

```bash
pytest
```

Run Docker checks:

```bash
docker compose build
docker compose up
```

### Playwright main user flow

The end-to-end flow should verify:

1. Open the application.
2. Sign in using the demo credentials.
3. Confirm that one board is visible.
4. Confirm that exactly five columns are visible.
5. Rename a column.
6. Add a card.
7. Confirm that the new card appears.
8. Move the card to another column.
9. Confirm that the card appears in the destination column.
10. Delete the card.
11. Confirm that the card disappears.
12. Reload the page and verify persisted board changes where applicable.

### Manual verification

Confirm:

- Docker Compose starts the application.
- The frontend runs at `http://localhost:3000`.
- The backend runs at `http://localhost:8000`.
- The health endpoint works.
- The fake sign-in works.
- One board is displayed.
- Exactly five columns are displayed.
- Columns can be renamed.
- Cards can be added.
- Cards can be deleted.
- Cards can be moved between columns.
- Database changes persist after a container restart.
- The layout works at desktop and mobile widths.
- No unexpected browser console errors appear.
- No functionality outside the MVP scope has been added.
- The start and stop scripts work.

### Documentation

Update:

- `README.md`
- `docs/PLAN.md`

Keep `README.md` minimal.

Include only:

- project purpose
- main technologies
- Docker requirements
- start command
- stop command
- local frontend URL
- local backend URL
- demo credentials
- test commands

### Success criteria

- Frontend linting passes.
- Frontend tests pass.
- Backend tests pass.
- Playwright tests pass.
- The frontend production build succeeds.
- Docker images build successfully.
- Docker Compose starts successfully.
- All business requirements are complete.
- All limitations have been respected.
- The application is ready for review.

## Part 11: Backend foundation for the expansion

Convert the backend to `Depends`-based session injection and Alembic migrations, removing the import-time engine/schema/seed side effect and the shared-mutable-state test setup that Parts 12+ would not scale to.

### Tasks

- Convert `get_session` to a `Depends`-based generator; convert every route to `session: Session = Depends(get_session)`.
- Replace the import-time `engine = create_db_and_tables()` with lazy `engine = get_engine()`; move seeding into a FastAPI `lifespan` hook.
- Add Alembic: `alembic.ini`, `migrations/env.py` (`render_as_batch=True` for SQLite), `migrations/script.py.mako` (with `import sqlmodel`), `migrations/versions/0001_baseline.py` mirroring the existing schema exactly.
- Update `backend/Dockerfile`'s `CMD` to run `alembic upgrade head` before `uvicorn`.
- Add `backend/conftest.py`: per-test in-memory engine/session/client fixtures via `app.dependency_overrides`; delete the import-order `DATABASE_URL` hack.
- Split `test_main.py` into `test_health.py` / `test_columns.py` / `test_cards.py`, parameterized off a `seeded_board` fixture instead of hardcoded ids.
- Add `test_migrations.py`: smoke-test `alembic upgrade head` against a temp SQLite file.

### Tests

- `pytest` green with per-test isolated fixtures (no more import-order dependency).
- `alembic upgrade head` on an empty file produces the current schema; verified against both a fresh volume and a pre-Alembic volume (caught and fixed a stale-partial-migration issue from SQLite's non-transactional DDL during that check).

### Success criteria

- Backend boots via `alembic upgrade head && uvicorn` in Docker and serves the seeded board unchanged.
- No behavior change visible to the frontend.

## Part 12: Users and real authentication

Replace the fake, tokenless sign-in with real accounts: bcrypt password hashing, a `User` table, and a JWT issued as an httpOnly cookie.

### Tasks

- Add `User` model (`id`, `email` unique, `hashed_password`, `created_at`) and `Board.owner_id` FK; migration `0002` creates `user`, adds `board.owner_id`, and backfills existing boards onto a demo user so an existing deployment isn't orphaned.
- New `backend/auth.py`: `hash_password`/`verify_password` (bcrypt, `BCRYPT_ROUNDS` env-configurable), `create_access_token`/`decode_access_token` (PyJWT, HS256), cookie constants.
- Routes: `POST /api/auth/sign-up` (hashes password, creates the user's first default board, sets cookie, 201), `POST /api/auth/sign-in`, `POST /api/auth/sign-out`, `GET /api/auth/me`.
- `get_current_user` dependency added but not yet enforced on board/column/card routes (kept the then-current frontend working).
- CORS gets `allow_credentials=True`; `compose.yaml` gets `JWT_SECRET`/`COOKIE_SECURE`.
- Demo credentials (`DEMO_EMAIL`/`DEMO_PASSWORD`) still work: a demo user is now seeded for real via the lifespan hook instead of being a hardcoded env-var comparison.

### Tests

- `test_auth.py`: signup (cookie is httpOnly, creates 5 columns + 8 cards), duplicate email → 409, invalid email/short password → 422, sign-in success/failure, `/api/auth/me` 401/200, sign-out clears the cookie.

### Success criteria

- Verified live via Docker against both a fresh volume and the pre-existing volume from Part 11 (the latter exercised the migration's backfill path and caught a real bug: `inserted_primary_key` is unreliable for a bare `sa.table()` insert against SQLite).

## Part 13: Frontend authentication

Replace the inline fake sign-in gate in `page.tsx` with real `/sign-in` and `/sign-up` routes wired to Part 12's endpoints, and a cookie-based session the rest of the app can read.

### Tasks

- `api.ts`: `credentials: "include"` on every request, an `ApiError` class carrying HTTP status, `signUp`/`signIn`/`signOut`/`fetchCurrentUser`.
- New `sign-in/page.tsx`, `sign-up/page.tsx`, shared `AuthForm.tsx`.
- `AuthProvider`/`useAuth()` context mounted at the root layout, checking `/api/auth/me` on load.
- `page.tsx` becomes a thin redirect based on auth status.
- Remove the demo-credential hint UI and `NEXT_PUBLIC_DEMO_PASSWORD` from `compose.yaml`.
- Add a `next/navigation` mock to `vitest.setup.ts` (needed once components call `useRouter`).

### Tests

- New sign-in/sign-up page tests; `page.test.tsx` rewritten around the redirect behavior instead of the old inline gate.

### Success criteria

- Verified live: CORS returns `access-control-allow-credentials: true` and a specific (non-wildcard) `allow-origin`, and the session cookie round-trips end to end.
- Documented behavior change: sign-in now persists across a refresh (7-day cookie) instead of resetting, since it's a real account now.

## Part 14: Multi-board backend and ownership enforcement

### Tasks

- New routes behind `Depends(get_current_user)`: `GET/POST /api/boards`, `GET/PATCH/DELETE /api/boards/{board_id}`.
- `get_owned_board`/`get_owned_column`/`get_owned_card` helpers added to every column/card route; a board/column/card owned by someone else 404s (not 403), so a guessed id can't be distinguished from one that doesn't exist. `move_card` also rejects moving into a column on a different one of the caller's *own* boards.
- `GET /api/board` (singular) kept as a deprecated, user-scoped shim so the Part 13 frontend kept working; removed in Part 18.
- `db.create_board()` split out from `create_default_board()`: boards created after signup get five empty columns, no dummy cards (those are only for a brand-new user's very first board).

### Tests

- `test_boards.py`, `test_ownership.py`: CRUD, cascade delete, cross-user 404s, no-cookie 401s.
- Verified live with two real signed-up users: second board created for user A, user B gets 404 on user A's board id and sees only their own board in their list.

### Success criteria

- Ownership enforced on every existing and new board/column/card route.

## Part 15: Frontend multi-board routing

Dismantle the single-page board UI into real routes.

### Tasks

- `boards/layout.tsx` (auth gate, shared header with sign-out), `boards/page.tsx` (list/create/delete via new `BoardList.tsx`), `boards/[boardId]/page.tsx` (the old board logic, keyed by `useParams`, hitting `/api/boards/{boardId}`).
- `BoardList.tsx` is props-driven like `Board.tsx`, so it's fetch-mock-free to test.
- A foreign or nonexistent board id shows "Board not found" instead of an error, using `ApiError`'s status from Part 13.
- `BoardState`/`boardReducer` unchanged: the board id lives in the route now, not in state, so there's no second source of truth.

### Tests

- New `BoardList.test.tsx`, `boards/page.test.tsx`, `boards/[boardId]/page.test.tsx`.

### Success criteria

- Verified end to end against the real backend: sign up → list boards → fetch a board by id, confirming the response shape matches `normalizeBoardResponse`.

## Part 16: Column CRUD and card editing (backend)

### Tasks

- `POST /api/boards/{board_id}/columns` (appends), `DELETE /api/columns/{column_id}` (cascades its cards, resequences siblings), `PATCH /api/boards/{board_id}/columns/reorder` (full `column_ids` list, validated as an exact permutation via a set-equality-plus-length check), `PATCH /api/cards/{card_id}` (title/details, same validation as add-card).
- No schema change needed.

### Tests

- Create/delete/reorder/edit, each 404s for a foreign user, 401s with no cookie.
- Verified live: add column, edit card, reorder (including confirming the reorder endpoint rejects an incomplete id set), delete column with resequencing.

### Success criteria

- All new routes go through the existing ownership helpers.

## Part 17: Column CRUD and card editing UI (frontend)

### Tasks

- `boardReducer`/`types.ts` gain `editCard`/`addColumn`/`deleteColumn`/`reorderColumns` actions (same server-authoritative convention as the existing ones).
- `AddCardModal.tsx` generalized into `CardModal.tsx` with an `add`/`edit` mode (discriminated union props); existing add-mode test ids preserved; edit mode's modal renders as a DOM sibling of the sortable card, not nested inside it, matching `Column.tsx`'s existing modal placement.
- `Card.tsx` gets an edit button next to delete (same `onPointerDown` stop-propagation guard).
- `Column.tsx` gets a delete-column button (no confirmation) and move-left/move-right buttons.
- `Board.tsx` computes the swapped column-id order (`resolveColumnMove`, new in `boardReducer.ts`) and a trailing "add column" inline form. Column reordering is buttons, not drag-and-drop, to avoid touching the board's already-subtle 3-tier collision detection.

### Tests

- Extended `Board.test.tsx` and `boardReducer.test.ts` for every new interaction.
- One correctness fix along the way: `CardModal` originally re-synced its form fields in a `useEffect` keyed on `isOpen`, which trips `react-hooks/set-state-in-effect`. Rewritten to adjust state during render instead, per React's own guidance for this exact pattern.

### Success criteria

- Verified live through the exact request shapes the frontend sends.

## Part 18: Test isolation, e2e rework, cleanup

### Tasks

- `e2e/helpers.ts`: `signUpFreshUser`/`createBoard`/`openBoard`. Every spec now signs up a brand-new user instead of relying on shared demo credentials and hardcoded seed ids, removing the old suite's "one persistent, unisolated database" fragility.
- New specs: `auth.spec.ts`, `boards.spec.ts`, `isolation.spec.ts` (a second user can't see or open the first user's board or board URL). `kanban.spec.ts` rewritten the same way, plus coverage for card editing and column add/move/delete; `dragCardTo` kept verbatim.
- Removed the deprecated `GET /api/board` shim and the leftover `GET /` hello-world HTML page from the Part 2 scaffolding milestone.

### Tests

- Full gate: `pytest` (48/48), `npm run lint`, `npm test` (44/44), `npm run build`, `npm run test:e2e` (16/16), `docker compose build && docker compose up`, with the removed route confirmed gone (404) via `/openapi.json`.

### Success criteria

- e2e suite passes with zero dependency on run order or prior runs' leftover data.

## Part 19: Documentation sync

### Tasks

- Rewrote `backend/AGENTS.md`: business requirements and "do not build" list updated for the new scope (multi-board, real accounts, card editing, column CRUD now in scope; sharing/collaboration/roles beyond owner still explicitly out). Replaced the "Fake sign-in experience" section with "Authentication". Removed the stale "a database table for users is not required" line.
- Appended this record (Parts 11-19) to `docs/PLAN.md`.
- Updated `CLAUDE.md`'s Project/Architecture sections for the new route map, cookie auth model, Alembic, and `Depends`-based sessions.
- Updated `README.md`/`compose.yaml` for the new env vars and sign-up flow.

### Success criteria

- No document still tells a future session to "fix" the app back to the frozen single-board scope.

## Progress checklist

- [x] Part 1: Plan
- [x] Part 2: Scaffolding
- [x] Part 3: Add in Frontend
- [x] Part 4: Add in a fake user sign in experience
- [x] Part 5: Database modeling
- [x] Part 6: Backend
- [x] Part 7: Frontend + Backend
- [x] Part 8: Drag and drop
- [x] Part 9: UI, responsiveness and accessibility
- [x] Part 10: Testing, final verification and delivery
- [x] Part 11: Backend foundation for the expansion
- [x] Part 12: Users and real authentication
- [x] Part 13: Frontend authentication
- [x] Part 14: Multi-board backend and ownership enforcement
- [x] Part 15: Frontend multi-board routing
- [x] Part 16: Column CRUD and card editing (backend)
- [x] Part 17: Column CRUD and card editing UI (frontend)
- [x] Part 18: Test isolation, e2e rework, cleanup
- [x] Part 19: Documentation sync

Do not mark a part as complete until all of its tasks and success criteria have been verified.

Verified as of 2026-08-06: `docker compose build` succeeds for both services; backend `pytest` (15/15) passes inside the built image; frontend `npx vitest run` (18/18), `npx eslint .`, and `npm run build` all pass; the Playwright e2e suite (6/6) passes reliably across repeated runs against a persistent local database (not just a freshly seeded one).
