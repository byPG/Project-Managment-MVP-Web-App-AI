# The Project Management MVP Web Application

## Business requirements

Build a modern Kanban-style project management web application.

This started as a single-board MVP (see `docs/PLAN.md` Parts 1-10) and was later, explicitly, expanded to support real user accounts and multiple personal boards per user (`docs/PLAN.md` Parts 11-19). The requirements below describe the current, expanded scope; where anything here disagrees with an older doc or comment, this file wins.

The application must provide:

- Real user accounts: sign up, sign in, sign out, with a persisted session.
- Each user has their own private set of boards - not shared, not visible to other users.
- Users can create, list, rename, and delete their own boards.
- Each new user's first board is seeded with five default columns and dummy cards; boards created afterward get five empty columns and no dummy cards.
- Columns can be renamed.
- Columns can be added, deleted, and reordered within a board.
- Cards containing only:
  - a title
  - a details field
- The ability to add a new card to a selected column.
- The ability to edit an existing card's title and details.
- The ability to delete an existing card.
- Drag-and-drop functionality for moving cards between columns.
- Moving a card to the end of the destination column is acceptable.
- Reordering cards within the same column is not required.
- Data persistence through the backend and database.
- A polished, modern, responsive, and professional user interface.

The project must include:

- a Next.js frontend
- a FastAPI backend
- a SQLite database
- Docker infrastructure
- start and stop scripts
- automated tests

The main priority is a reliable and visually polished application with a deliberately constrained feature set - the expansion to multi-user/multi-board was a specific, approved scope change, not an invitation to keep adding features.

## Limitations

Do not add functionality outside the scope defined above.

The application must not include:

- board sharing, collaborators, or any multi-user access to one board
- teams, workspaces, or organizations
- roles or permissions beyond a board's single owner
- refresh tokens or multi-device/multi-session management
- password recovery
- email verification
- social sign-in
- search
- filtering
- archiving
- card labels
- card categories
- card priorities
- due dates
- assignees
- comments
- attachments
- notifications
- activity history
- theme switching
- real-time collaboration
- analytics
- external integrations
- cloud storage
- complex animations
- microservices
- Kubernetes
- Redis
- message queues
- GraphQL
- unnecessary infrastructure

Do not introduce additional features without an explicit request.

Do not create abstractions, services, endpoints, database tables, or infrastructure for functionality that is not required by the current scope.

## Technical decisions

### Project structure

Use the following top-level structure:

```text
project-root/
├── backend/
├── frontend/
├── docs/
├── scripts/
├── compose.yaml
├── .gitignore
├── AGENTS.md
└── README.md
```

Only create additional directories when they are genuinely required.

### Frontend

Implement the frontend as a modern Next.js application.

Requirements:

- Use Next.js with the App Router.
- Use TypeScript.
- Create the application inside the `frontend/` directory.
- Use the `src/` directory.
- Use the `@/*` import alias.
- Use ESLint.
- Use client components for interactive board functionality.
- Use CSS Modules for component styles.
- Use `src/app/globals.css` for:
  - the CSS reset
  - global typography
  - CSS custom properties
  - the application background
- Do not use Tailwind CSS.
- Do not use a UI component framework.
- Do not use Redux, Zustand, MobX, or another global state management library.
- Use standard React state and API calls; React context is acceptable for cross-cutting concerns like the current-user/auth state (it is not one of the banned global state libraries).
- Use `lucide-react` when icons are required.
- Do not use emojis as interface icons.
- Routes: `/sign-in`, `/sign-up`, `/boards` (list), `/boards/[boardId]` (detail). The board id lives in the route, not in client-side reducer state.
- `frontend/package.json` pins a Next.js version newer than most AI training data (breaking API/convention changes are possible release to release). Before writing routing code, check `frontend/node_modules/next/dist/docs/` for the version actually installed rather than assuming prior knowledge still applies - e.g. `middleware.ts` was renamed to `proxy.ts` in Next 16.

### Backend

Implement the backend inside the `backend/` directory.

Requirements:

- Use FastAPI.
- Use Python type hints.
- Use Pydantic models for API validation.
- Use SQLModel for database models and database access.
- Use SQLite as the database.
- Provide a health-check endpoint.
- Provide API endpoints required by the frontend.
- Enable CORS only for the local frontend origin required by the application.
- Keep the backend synchronous unless asynchronous code provides a clear and necessary benefit.
- Do not introduce service layers or repository patterns unless they genuinely simplify the implementation.

The backend must provide the minimum API needed for:

- sign-up, sign-in, sign-out, and reading the current user
- listing, creating, renaming, and deleting a user's own boards
- loading a board (columns and cards)
- renaming, creating, deleting, and reordering columns
- creating, editing, and deleting a card
- moving a card between columns

Current endpoints:

```text
GET    /api/health
POST   /api/auth/sign-up
POST   /api/auth/sign-in
POST   /api/auth/sign-out
GET    /api/auth/me
GET    /api/boards
POST   /api/boards
GET    /api/boards/{board_id}
PATCH  /api/boards/{board_id}
DELETE /api/boards/{board_id}
POST   /api/boards/{board_id}/columns
PATCH  /api/boards/{board_id}/columns/reorder
PATCH  /api/columns/{column_id}
DELETE /api/columns/{column_id}
POST   /api/columns/{column_id}/cards
PATCH  /api/cards/{card_id}
DELETE /api/cards/{card_id}
PATCH  /api/cards/{card_id}/move
```

Endpoint names may be adjusted when necessary, but the API must remain small and consistent. Every board/column/card route is scoped to the authenticated user; a board/column/card owned by someone else returns 404 (not 403), so a guessed id can't be distinguished from one that doesn't exist.

### Authentication

Real accounts, not a fake sign-in:

- `POST /api/auth/sign-up` hashes the password (bcrypt) and creates the user, seeding their first board (five default columns, dummy cards).
- `POST /api/auth/sign-in` verifies the password and issues a session.
- Sessions are a JWT (PyJWT, HS256) delivered as an httpOnly cookie (`samesite=lax`, `secure` from the `COOKIE_SECURE` env var) - never returned in the response body, never stored in `localStorage`.
- `POST /api/auth/sign-out` clears the cookie.
- `GET /api/auth/me` returns the current user or 401.
- No password recovery, email verification, social sign-in, or refresh-token/multi-device session management.
- The frontend must send `credentials: "include"` on every request so the cookie round-trips; the backend's CORS config needs `allow_credentials=True` and an explicit (non-wildcard) origin list to match.
- Auth is a client-side gate only (check `/api/auth/me` on load, redirect if anonymous) - no Next.js server components or Proxy read the session, since the cookie is set by the FastAPI origin, not by Next.js itself.

### Database

Use SQLite with SQLModel.

Store the SQLite database file in a Docker volume so board data persists when containers are restarted.

The minimum database models are:

#### User

- `id`
- `email` (unique)
- `hashed_password`
- `created_at`

#### Board

- `id`
- `owner_id` (FK to `user.id`)
- `name`

#### Column

- `id`
- `board_id`
- `name`
- `position`

#### Card

- `id`
- `column_id`
- `title`
- `details`
- `position`

Schema changes ship as Alembic migrations (`backend/migrations/`), not by dropping the SQLite file. `SQLModel.metadata.create_all` is test-only (used against an in-memory DB in `conftest.py` fixtures); it is not how the real database gets its schema. When generating a migration by hand, remember `sqlmodel.sql.sqltypes.AutoString()` needs `import sqlmodel` in the migration file.

Each new user's first board is seeded automatically on sign-up with five default columns and dummy cards. Boards created afterward (`POST /api/boards`) get five default columns and no dummy cards - dummy data is only for a brand-new user's first-run experience, not every board.

### Drag and drop

Use:

- `@dnd-kit/core`
- `@dnd-kit/sortable` only when it is required

Drag-and-drop must support moving cards between columns.

When a card is dropped into another column:

1. Send the move request to the backend.
2. Update the database.
3. Update the frontend interface.
4. Ensure the card is removed from its previous column.
5. Ensure no duplicate card is created.

Provide clear visual feedback while a card is being dragged.

Do not implement a custom drag-and-drop system when the selected library already provides the required behaviour.

### Docker

Docker is a mandatory part of the project.

Create:

- `compose.yaml` in the project root
- `frontend/Dockerfile`
- `backend/Dockerfile`
- `.dockerignore` files where appropriate

The Docker Compose configuration must start:

- the frontend service
- the backend service

Do not create a separate database container. SQLite is used to keep the infrastructure simple.

Use a Docker volume for the SQLite database file.

Expose:

- frontend on `http://localhost:3000`
- backend on `http://localhost:8000`

Configure the frontend API URL through an environment variable such as:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

The backend must include a health check.

The frontend service should depend on a healthy backend service where supported by the Docker Compose configuration.

### Start and stop scripts

Create start and stop scripts inside the `scripts/` directory.

Required scripts:

```text
scripts/start.sh
scripts/stop.sh
scripts/start.ps1
scripts/stop.ps1
```

The start scripts must run:

```bash
docker compose up --build
```

The stop scripts must run:

```bash
docker compose down
```

Keep the scripts small and easy to understand.

### Testing

Use:

#### Frontend

- Vitest
- React Testing Library
- Playwright

#### Backend

- pytest
- FastAPI TestClient or HTTPX

Tests must cover the most important behaviour:

- backend health check
- sign-up, sign-in, sign-out, and reading the current user
- creating, listing, renaming, and deleting a board
- loading a board, rendering its columns and cards
- renaming, creating, deleting, and reordering columns
- adding a card, preventing a card without a title
- editing a card
- deleting a card
- moving a card between columns, preserving card data after a move
- cross-user isolation: a user cannot read, edit, or delete another user's board, column, or card (404, not 403), and gets 401 with no session at all

Add at least one Playwright test covering the main user flow (sign up through to a working board). Playwright specs should sign up their own fresh user rather than relying on shared demo credentials or seeded ids, so tests don't depend on run order or leftover data from a previous run.

Do not pursue 100% test coverage.

Test important behaviour rather than implementation details.

### Quality checks

Before considering the project complete, run the relevant checks.

Frontend:

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

Backend:

```bash
pytest
```

Docker:

```bash
docker compose build
docker compose up
```

All required checks must pass.

## Starting point

Before making changes:

1. Read this `AGENTS.md` file.
2. Review the `docs/PLAN.md` document.
3. Inspect the existing repository structure.
4. Check whether any frontend, backend, Docker, or configuration files already exist.
5. Respect existing working code and configuration.
6. Do not recreate working files unnecessarily.
7. Follow the implementation order defined in `docs/PLAN.md`.
8. Update the plan after completing each phase.

Begin with the Docker and backend scaffolding required by Part 2 of `docs/PLAN.md`.

The first working milestone must:

- start through Docker Compose
- run the FastAPI backend
- serve example static HTML from the backend
- display a Hello World message
- make a successful API request to the backend health endpoint

Do not begin the full Next.js interface until the initial Docker and backend communication milestone works.

## Color scheme

Define the frontend colours as CSS custom properties in `frontend/src/app/globals.css`.

- Background: `#0F1115` — main application background
- Surface: `#171A21` — board columns and primary containers
- Elevated Surface: `#20242D` — cards, dialogs, and dropdowns
- Primary Blue: `#4F8CFF` — primary buttons, links, and active elements
- Accent Teal: `#2DD4BF` — drag-and-drop indicators, highlights, and success states
- Secondary Purple: `#8B5CF6` — secondary actions and selected elements
- Danger Coral: `#F87171` — delete actions and error states
- Primary Text: `#F3F4F6` — headings and primary content
- Secondary Text: `#9CA3AF` — descriptions, labels, and placeholders
- Border: `#2B303B` — borders and visual separators

Use the colours consistently.

Do not introduce additional prominent colours unless they are required for accessibility.

The interface should use:

- dark solid backgrounds
- subtle borders
- restrained shadows
- clear hover states
- clearly visible keyboard focus states
- moderate corner rounding
- consistent spacing

Avoid:

- excessive gradients
- strong glow effects
- glassmorphism
- decorative animations

## Coding standards

- Use current stable versions of libraries and idiomatic approaches.
- Keep the implementation simple.
- Never over-engineer the solution.
- Always prefer the simplest solution that fulfils the requirements.
- Avoid unnecessary defensive programming.
- Do not add features outside the defined MVP scope.
- Use TypeScript strict mode.
- Do not use `any` unless there is a documented and unavoidable reason.
- Use Python type hints.
- Keep components, functions, modules, and API endpoints focused.
- Use clear and descriptive names.
- Prefer explicit code over clever code.
- Avoid deeply nested logic.
- Avoid unnecessary custom hooks.
- Avoid unnecessary service and repository layers.
- Avoid premature optimisation.
- Avoid duplicated business logic.
- Use immutable frontend state updates.
- Validate backend input with Pydantic.
- Return appropriate HTTP status codes.
- Handle expected API errors clearly.
- Remove unused imports, variables, components, styles, files, and dependencies.
- Do not leave commented-out code.
- Add comments only when they explain a non-obvious decision.
- Keep dependencies to a minimum.
- Keep `README.md` minimal and practical.
- Do not use emojis in the source code, documentation, interface, comments, or commit messages.

When a requirement is unclear, choose the simplest solution consistent with the MVP.

## Working documentation

All documents for planning and executing this project will be in the `docs/` directory.

Please review the `docs/PLAN.md` document before proceeding.

`docs/PLAN.md` is the main implementation and progress document. It must contain:

- implementation phases
- tasks
- measurable success criteria
- progress checklists
- important technical decisions
- identified problems
- final verification results

Update the relevant checklist after completing every phase.

Do not mark a phase as complete until all of its success criteria have been verified.

If `docs/PLAN.md` conflicts with the business requirements, limitations, or technical decisions in `AGENTS.md`, follow `AGENTS.md` and update the plan before continuing.

Do not remove existing requirements from either document.

Existing requirements may only be:

- clarified
- expanded
- corrected
- reorganised without changing their meaning

Keep working documentation concise.

Do not create additional planning documents unless the information cannot reasonably be included in `docs/PLAN.md`.
