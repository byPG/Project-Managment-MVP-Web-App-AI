# The Project Management MVP Web Application

## Project Goal

Build a simple and polished Kanban-style project management web application.

This project is an MVP. Prioritise reliable core functionality, clean code, accessibility, and a professional user interface over additional features.

## Business Requirements

The application must provide:

- One Kanban board only.
- Exactly five columns.
- The ability to rename every column.
- Cards containing only:
  - a title
  - a details field
- The ability to add a card to a selected column.
- The ability to delete an existing card.
- Drag-and-drop functionality for moving cards between columns.
- Dummy board data displayed when the application first loads.
- A polished, modern, and responsive user interface.

When a card is dropped into another column, placing it at the end of that column is acceptable.

All changes exist only in the current browser session and may be reset after refreshing the page.

## Limitations

Do not add functionality outside the defined MVP scope.

The application must not include:

- multiple boards
- user accounts
- fake sign-in screens
- authentication
- authorisation
- a backend
- FastAPI
- API routes
- server actions
- Docker infrastructure
- a database
- database modelling
- local storage
- cloud storage
- external APIs
- frontend-to-backend communication
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
- card editing after creation
- theme switching
- real-time collaboration
- analytics
- complex animations

Do not introduce additional features without an explicit request.

Do not create abstractions or infrastructure for functionality that is not currently required.

## Technical Decisions

### Framework

- Use Next.js with the App Router.
- Use TypeScript.
- Create the application inside the `frontend/` directory.
- Use client-side React state for all board data and interactions.
- Do not use server-side data fetching.
- Do not use a state management library such as Redux, Zustand, or MobX.

### Project Setup

When creating the Next.js project, use:

- TypeScript
- App Router
- ESLint
- the `src/` directory
- the `@/*` import alias
- no Tailwind CSS

Respect the existing package manager and lock file.

If the repository does not contain a lock file, use npm.

Do not add Docker, backend services, database services, or infrastructure configuration.

### Styling

- Use CSS Modules for component styles.
- Use `src/app/globals.css` for:
  - the CSS reset
  - global typography
  - CSS custom properties
  - the application background
- Do not use a component library or UI framework.
- Do not use inline styles unless a value must be calculated dynamically.
- Keep animations limited to simple hover, focus, dialog, and drag-and-drop feedback.

### State Management

Use standard React state.

Prefer:

- `useState` for local state
- pure helper functions for board updates
- immutable state updates

The board state must contain:

- exactly five columns
- a unique and stable ID for every column
- a name for every column
- a cards array for every column
- a unique and stable ID for every card
- a title for every card
- a details field for every card

Keep the state structure simple and easy to understand.

### Drag and Drop

Use:

- `@dnd-kit/core`
- `@dnd-kit/sortable` only when required

Drag-and-drop must support moving cards between columns.

Provide clear visual feedback while a card is being dragged.

Do not build a custom drag-and-drop system when the selected library provides the required behaviour.

### Icons

Use `lucide-react` when icons are needed.

Do not use emojis as interface icons.

### Testing

Use:

- Vitest for unit tests
- React Testing Library for component tests
- Playwright for essential end-to-end tests

Tests must cover the most important behaviour:

- rendering the initial dummy data
- rendering exactly five columns
- renaming a column
- adding a card
- deleting a card
- moving a card between columns

Add at least one Playwright test covering the main user flow.

Do not pursue 100% test coverage.

Test important user behaviour rather than implementation details.

### Quality Checks

Before considering the project complete, run:

```bash
npm run lint
npm run test
npm run build
```
