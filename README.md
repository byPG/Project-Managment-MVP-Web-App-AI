# Project Management MVP

A Kanban project management app: sign up for an account, create multiple boards, add/rename/delete/reorder columns, add/edit/delete cards, and drag cards between columns.

## Technologies

- Frontend: Next.js (App Router), TypeScript, CSS Modules, `@dnd-kit`
- Backend: FastAPI, SQLModel, SQLite
- Docker Compose for local development

## Running with Docker

Requires Docker and Docker Compose.

Start:

```bash
scripts/start.sh    # macOS/Linux
scripts/start.ps1   # Windows
```

Stop:

```bash
scripts/stop.sh     # macOS/Linux
scripts/stop.ps1    # Windows
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Sign-in

The app has real user accounts (hashed passwords, session cookie). Sign up for your own account at `/sign-up`.

A demo account is also seeded on backend startup for convenience:

- Email: `demo@kanban.app`
- Password: `password123`

The demo credentials can be overridden with the `DEMO_EMAIL`/`DEMO_PASSWORD` environment variables. Other backend environment variables — see `compose.yaml`:

- `JWT_SECRET` — signs the session cookie; set a real secret outside local dev.
- `COOKIE_SECURE` — `false` for local http, must be `true` behind https.

## Tests

Backend (from `backend/`, with dependencies installed):

```bash
pytest
```

Frontend (from `frontend/`):

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```
