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

## Progress checklist

- [ ] Part 1: Plan
- [ ] Part 2: Scaffolding
- [ ] Part 3: Add in Frontend
- [ ] Part 4: Add in a fake user sign in experience
- [ ] Part 5: Database modeling
- [ ] Part 6: Backend
- [ ] Part 7: Frontend + Backend
- [ ] Part 8: Drag and drop
- [ ] Part 9: UI, responsiveness and accessibility
- [ ] Part 10: Testing, final verification and delivery

Do not mark a part as complete until all of its tasks and success criteria have been verified.
