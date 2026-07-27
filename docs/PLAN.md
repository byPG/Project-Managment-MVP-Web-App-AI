# High-Level Project Plan

## Project Objective

Build a polished MVP of a Kanban-style project management web application.

The application will contain one board with exactly five renameable columns. Users will be able to add, delete, and move cards between columns.

The project is intentionally frontend-only. It does not require authentication, a backend, a database, or data persistence.

---

## Part 1: Planning and Repository Review

### Tasks

- Review `AGENTS.md`.
- Review this `docs/PLAN.md` document.
- Inspect the existing repository structure.
- Check whether the `frontend/` directory already exists.
- Check which package manager and lock file are already used.
- Confirm the implementation scope before writing code.
- Identify the smallest set of components, types, and utilities required for the MVP.

### Success Criteria

- The project scope is understood.
- No functionality outside the MVP has been planned.
- The existing repository structure has been inspected.
- The implementation approach is documented in this file.
- The next development steps are clear.

---

## Part 2: Frontend Scaffolding

### Tasks

Create or configure a Next.js application inside the `frontend/` directory.

Use:

- Next.js
- App Router
- TypeScript
- ESLint
- the `src/` directory
- the `@/*` import alias
- CSS Modules
- npm, unless the repository already uses another package manager

Configure:

- `.gitignore`
- TypeScript strict mode
- global styles
- CSS custom properties
- linting
- unit testing
- Playwright
- required package scripts

Do not add:

- Docker
- a backend
- API routes
- server actions
- authentication
- a database
- persistence
- a state management library
- Tailwind CSS
- a UI component framework

### Success Criteria

- The application exists inside `frontend/`.
- The development server starts successfully.
- The default page loads without runtime errors.
- TypeScript strict mode is enabled.
- ESLint runs successfully.
- Test configuration is available.
- Playwright configuration is available.
- The project contains a correct `.gitignore`.
- No unnecessary infrastructure has been introduced.

---

## Part 3: Application Foundation

### Tasks

- Create the main application layout.
- Create the global colour variables.
- Add a basic CSS reset.
- Configure the application background and typography.
- Define TypeScript types for:
  - the board
  - columns
  - cards
- Create initial dummy data.
- Ensure the dummy board contains exactly five columns.
- Give every column and card a stable unique ID.
- Create the minimum required component structure.

Suggested components:

- `KanbanBoard`
- `KanbanColumn`
- `TaskCard`
- `AddCardForm`
- `RenameColumnForm`

Only create additional components when they provide a clear benefit.

### Success Criteria

- The application renders the main page layout.
- Global styles and colour variables are applied.
- TypeScript types are defined.
- Initial dummy data is available.
- The dummy board contains exactly five columns.
- The component structure remains simple and understandable.

---

## Part 4: Board and Column Rendering

### Tasks

- Render the single Kanban board.
- Render exactly five columns.
- Display the name of each column.
- Render the initial cards inside their assigned columns.
- Display each card title and details.
- Use stable IDs as React keys.
- Add horizontal scrolling when the board does not fit the viewport.
- Preserve a readable minimum width for each column.

### Success Criteria

- One board is visible.
- Exactly five columns are visible.
- Each column displays its correct name.
- Dummy cards appear in the correct columns.
- Card titles and details are readable.
- The board works without layout errors on desktop and smaller screens.

---

## Part 5: Column Renaming

### Tasks

- Add a simple way to rename a column.
- Use a text input or a small dialog.
- Pre-fill the current column name.
- Prevent empty column names from being saved.
- Allow the user to confirm or cancel the change.
- Update the board state immutably.
- Keep the column ID unchanged after renaming.

### Success Criteria

- Every column can be renamed.
- The current name is available while editing.
- Empty names cannot be saved.
- Cancelling does not modify the column.
- Renaming does not affect cards or column IDs.
- The new name is immediately visible.

---

## Part 6: Card Creation and Deletion

### Tasks

Implement card creation.

Each new card must contain only:

- a title
- a details field

Requirements:

- A card can be added to a selected column.
- The title is required.
- The details field may be optional.
- A unique ID is generated for every new card.
- A newly created card is added to the end of the selected column.

Implement card deletion.

Requirements:

- Every card has a clearly identifiable delete action.
- Deleting a card removes only the selected card.
- The state update must be immutable.
- A lightweight confirmation may be used if it does not complicate the experience.

### Success Criteria

- A card can be added to any column.
- A card cannot be added without a title.
- New cards display the entered title and details.
- New cards receive unique IDs.
- Cards can be deleted.
- Deleting one card does not affect other cards.
- No card editing or additional card fields have been introduced.

---

## Part 7: Drag and Drop

### Tasks

- Install and configure `@dnd-kit/core`.
- Use `@dnd-kit/sortable` only if it is necessary.
- Allow cards to be moved between columns.
- Moving a card to the end of the destination column is acceptable.
- Remove the moved card from its original column.
- Prevent duplicate cards after moving.
- Provide clear visual feedback while dragging.
- Highlight a valid drop target.
- Keep the implementation understandable and avoid unnecessary custom drag logic.

### Success Criteria

- A card can be dragged from one column to another.
- The card is removed from the original column.
- The card appears in the destination column.
- No duplicate card is created.
- No card data is lost.
- Dragging provides visible feedback.
- The board state remains valid after repeated moves.

---

## Part 8: UI, Responsiveness, and Accessibility

### Tasks

- Apply the defined colour scheme.
- Add consistent spacing, borders, and corner rounding.
- Use restrained shadows.
- Add clear hover, active, focus, and drag states.
- Ensure the interface works on:
  - desktop
  - tablet
  - mobile
- Use horizontal board scrolling on smaller screens.
- Ensure forms and dialogs fit inside the mobile viewport.
- Use semantic HTML.
- Associate labels with form fields.
- Add accessible names to icon-only buttons.
- Use native buttons for actions.
- Add visible keyboard focus indicators.
- Ensure text and controls have sufficient contrast.
- Do not use colour as the only indication of meaning.
- Do not use emojis as interface icons.

### Success Criteria

- The interface follows the approved colour scheme.
- The UI is consistent and professional.
- The board remains usable on smaller screens.
- Controls can be used with a keyboard.
- Inputs have accessible labels.
- Icon-only buttons have accessible names.
- Focus indicators are clearly visible.
- No major layout overflow or text readability issues remain.

---

## Part 9: Automated Testing

### Unit and Component Tests

Use:

- Vitest
- React Testing Library

Test important user behaviour:

- rendering the initial dummy data
- rendering exactly five columns
- renaming a column
- preventing an empty column name
- adding a card
- preventing a card without a title
- deleting a card
- moving a card between columns

Prefer testing pure state helper functions when drag-and-drop interaction is difficult to reproduce reliably in a component test.

### End-to-End Tests

Use Playwright to test at least one main user flow:

1. Open the application.
2. Confirm that the board and five columns are visible.
3. Rename a column.
4. Add a card.
5. Confirm that the new card appears.
6. Delete the card.
7. Confirm that the card disappears.

Add a drag-and-drop test when it can be implemented reliably without excessive complexity.

### Success Criteria

- Important application behaviour is covered by tests.
- Tests verify behaviour rather than internal implementation details.
- Unit and component tests pass.
- Playwright tests pass.
- Tests do not depend on external services.
- Test configuration remains simple.

---

## Part 10: Final Verification

### Tasks

Run all required checks from the `frontend/` directory:

```bash
npm run lint
npm run test
npm run build
```
