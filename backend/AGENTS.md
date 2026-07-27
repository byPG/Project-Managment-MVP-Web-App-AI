# The Project Management MVP Web Application

## Business requirements

Build an MVP of a modern Kanban-style project management web application.

The application must provide:

- One Kanban board only.
- Exactly five fixed columns.
- The ability to rename every column.
- The columns cannot be added or deleted.
- Cards containing only:
  - a title
  - a details field
- The ability to add a new card to a selected column.
- The ability to delete an existing card.
- Drag-and-drop functionality for moving cards between columns.
- Moving a card to the end of the destination column is acceptable.
- Reordering cards within the same column is not required.
- Dummy board data displayed when the application is started for the first time.
- Data persistence through the backend and database.
- A simple fake user sign-in experience.
- A polished, modern, responsive, and professional user interface.

The project must include:

- a Next.js frontend
- a FastAPI backend
- a SQLite database
- Docker infrastructure
- start and stop scripts
- automated tests

The main priority is a reliable and visually polished MVP with a deliberately small feature set.

## Limitations

Do not add functionality outside the defined MVP scope.

The application must not include:

- multiple boards
- real user registration
- production authentication
- password recovery
- email verification
- social sign-in
- roles and permissions
- multiple user accounts
- column creation
- column deletion
- card editing after creation
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

Do not create abstractions, services, endpoints, database tables, or infrastructure for functionality that is not required by the current MVP.

The fake sign-in experience must not be presented as production-ready authentication.

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
- Use standard React state and API calls.
- Use `lucide-react` when icons are required.
- Do not use emojis as interface icons.

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

- fake sign-in
- loading the board
- renaming a column
- creating a card
- deleting a card
- moving a card between columns

Suggested endpoints:

```text
GET    /api/health
POST   /api/auth/sign-in
GET    /api/board
PATCH  /api/columns/{column_id}
POST   /api/columns/{column_id}/cards
DELETE /api/cards/{card_id}
PATCH  /api/cards/{card_id}/move
```

Endpoint names may be adjusted when necessary, but the API must remain small and consistent.

### Fake sign-in experience

Create a simple fake sign-in experience.

The simplest acceptable implementation is:

- display a sign-in page before the board
- provide predefined demo credentials
- send the credentials to the FastAPI backend
- return a predefined demo user after successful validation
- store the signed-in state only in frontend memory
- do not create access tokens, refresh tokens, sessions, cookies, or production authentication logic

Use environment variables for the predefined demo credentials where practical.

The fake sign-in state may reset when the page is refreshed.

### Database

Use SQLite with SQLModel.

Store the SQLite database file in a Docker volume so board data persists when containers are restarted.

The minimum database models are:

#### Board

- `id`
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

A database table for users is not required because the sign-in experience is intentionally fake.

The database must contain:

- exactly one board
- exactly five initial columns
- initial dummy cards

Seed the database automatically when it is empty.

Do not create endpoints for adding or deleting boards or columns.

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
- fake sign-in
- loading the seeded board
- rendering exactly five columns
- rendering initial dummy cards
- renaming a column
- preventing an empty column name
- adding a card
- preventing a card without a title
- deleting a card
- moving a card between columns
- preserving card data after a move

Add at least one Playwright test covering the main user flow.

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
