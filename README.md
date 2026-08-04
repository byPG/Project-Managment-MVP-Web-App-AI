# Project Management MVP

A single-board Kanban project management app: rename columns, add and delete cards, and drag cards between columns.

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

## Demo sign-in

The app uses a fake sign-in (no real authentication). Default demo credentials:

- Email: `demo@kanban.app`
- Password: `password123`

These can be overridden with the `DEMO_EMAIL`/`DEMO_PASSWORD` (backend) and `NEXT_PUBLIC_DEMO_EMAIL`/`NEXT_PUBLIC_DEMO_PASSWORD` (frontend) environment variables — see `compose.yaml`.

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
