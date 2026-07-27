# The Project Management MVP Web Application

## Project Goal

Build a simple, polished Kanban-style project management web application.

The project is an MVP. Prioritise reliable core functionality, clean code, and a professional user interface over the number of features.

## Business Requirements

The application must provide:

- One Kanban board only.
- Exactly five columns.
- The ability to rename each column.
- Cards containing only:
  - a title
  - a details field
- The ability to add a card to a selected column.
- The ability to delete an existing card.
- Drag-and-drop functionality for moving cards between columns.
- Dummy board data displayed when the application first loads.
- A polished, modern, and responsive user interface.

When a card is dropped into another column, placing it at the end of that column is acceptable. Complex card positioning is not required for the MVP.

All changes exist only in the current browser session and may be reset after refreshing the page.

## Limitations

Do not add functionality outside the defined MVP scope.

The application must not include:

- Multiple boards
- User accounts
- Authentication
- Authorisation
- A backend
- API routes
- Server actions
- A database
- Local storage
- Cloud storage
- Search
- Filtering
- Archiving
- Card labels
- Card categories
- Card priorities
- Due dates
- Assignees
- Comments
- Attachments
- Notifications
- Activity history
- Card editing after creation
- Theme switching
- Real-time collaboration
- Analytics
- Complex animations

Do not introduce additional features without an explicit request.

Do not create abstractions for functionality that is not currently required.

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
- The `src/` directory
- The `@/*` import alias
- No Tailwind CSS

Respect the existing package manager and lock file. If the repository does not contain a lock file, use npm.

### Styling

- Use CSS Modules for component styles.
- Use `src/app/globals.css` for:
  - CSS reset
  - global typography
  - CSS custom properties
  - application background
- Do not use a component library or UI framework.
- Do not use inline styles unless a value must be calculated dynamically.
- Keep animations limited to simple hover, focus, modal, and drag-and-drop feedback.

### State Management

Use standard React state.

Prefer:

- `useState` for small local component state
- pure helper functions for board updates
- immutable state updates

The board state should contain:

- five columns
- a unique ID for every column
- a name for every column
- a cards array for every column
- a unique ID for every card
- a title for every card
- a details field for every card

Keep the state structure simple and easy to understand.

### Drag and Drop

Use:

- `@dnd-kit/core`
- `@dnd-kit/sortable` only when required

Drag-and-drop must support moving cards between columns.

Provide clear visual feedback while a card is being dragged.

Do not build a custom drag-and-drop system when an established library can provide the required behaviour.

### Icons

Use `lucide-react` when icons are needed.

Do not use emoji as interface icons.

### Testing

Use:

- Vitest for unit tests
- React Testing Library for component tests
- Playwright for essential end-to-end tests

The minimum meaningful test coverage should verify:

- adding a card
- deleting a card
- renaming a column
- moving a card between columns
- rendering the initial dummy data

Add at least one Playwright test covering the main user flow.

Do not pursue 100% test coverage. Test important behaviour rather than implementation details.

### Quality Checks

Before considering the project complete, run:

```bash
npm run lint
npm run test
npm run build
```
