import type { BoardAction, BoardState, MoveCardPayload } from "./types";

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function findColumnIndex(columns: BoardState["columns"], columnId: string): number {
  return columns.findIndex((column) => column.id === columnId);
}

// Resolves a dnd-kit drag-end event (raw dragged-item id + raw drop-target
// id) into a moveCard payload, or null if the drop is a no-op. Card IDs and
// column IDs are independent auto-increment sequences from the backend, so a
// card's ID can coincidentally equal a column's ID (e.g. card 4 dropped on
// column 4) — this must not be mistaken for "dropped on itself" just because
// the raw ids match.
export function resolveDragMove(
  columns: BoardState["columns"],
  activeId: string,
  overId: string,
): MoveCardPayload | null {
  const fromColumn = columns.find((column) => column.cardIds.includes(activeId));
  if (!fromColumn) {
    return null;
  }

  const toColumn =
    columns.find((column) => column.id === overId) ??
    columns.find((column) => column.cardIds.includes(overId));
  if (!toColumn || toColumn.id === fromColumn.id) {
    return null;
  }

  return {
    cardId: activeId,
    fromColumnId: fromColumn.id,
    toColumnId: toColumn.id,
    toIndex: toColumn.cardIds.length,
  };
}

// Resolves a "move this column left/right" click into the full ordered
// column-id list reorderColumns expects. Returns the unchanged order if the
// column can't move further in that direction (already at an edge) or isn't
// found.
export function resolveColumnMove(
  columns: BoardState["columns"],
  columnId: string,
  direction: "left" | "right",
): string[] {
  const ids = columns.map((column) => column.id);
  const index = ids.indexOf(columnId);
  const targetIndex = direction === "left" ? index - 1 : index + 1;

  if (index === -1 || targetIndex < 0 || targetIndex >= ids.length) {
    return ids;
  }

  [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
  return ids;
}

// The backend is the source of truth: page.tsx applies every mutation by
// calling the API and then dispatching "setBoard" with the refreshed data.
// So renameColumn/addCard/deleteCard/moveCard below are never reached from
// the live app — only "setBoard" is. The other cases exist for this
// reducer's own unit tests (and as a safety net if a future change starts
// dispatching them directly).
export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case "renameColumn": {
      const title = action.title.trim();
      if (!title) {
        return state;
      }

      return {
        ...state,
        columns: state.columns.map((column) =>
          column.id === action.columnId ? { ...column, title } : column,
        ),
      };
    }

    case "addCard": {
      const title = action.card.title.trim();
      if (!title) {
        return state;
      }

      const id = createId("card");
      const newCard = {
        id,
        title,
        details: action.card.details.trim(),
      };

      return {
        cards: { ...state.cards, [id]: newCard },
        columns: state.columns.map((column) =>
          column.id === action.columnId
            ? { ...column, cardIds: [...column.cardIds, id] }
            : column,
        ),
      };
    }

    case "editCard": {
      const { cardId, title, details } = action.payload;
      const trimmedTitle = title.trim();
      if (!trimmedTitle || !state.cards[cardId]) {
        return state;
      }

      return {
        ...state,
        cards: {
          ...state.cards,
          [cardId]: { id: cardId, title: trimmedTitle, details: details.trim() },
        },
      };
    }

    case "setBoard": {
      return action.board;
    }

    case "addColumn": {
      const title = action.title.trim();
      if (!title) {
        return state;
      }

      const id = createId("column");
      return {
        ...state,
        columns: [...state.columns, { id, title, cardIds: [] }],
      };
    }

    case "deleteColumn": {
      const column = state.columns.find((candidate) => candidate.id === action.columnId);
      if (!column) {
        return state;
      }

      const removedCardIds = new Set(column.cardIds);
      const remainingCards = Object.fromEntries(
        Object.entries(state.cards).filter(([cardId]) => !removedCardIds.has(cardId)),
      );

      return {
        cards: remainingCards,
        columns: state.columns.filter((candidate) => candidate.id !== action.columnId),
      };
    }

    case "reorderColumns": {
      const columnsById = new Map(state.columns.map((column) => [column.id, column]));
      const reordered = action.columnIds
        .map((id) => columnsById.get(id))
        .filter((column): column is BoardState["columns"][number] => Boolean(column));

      if (reordered.length !== state.columns.length) {
        return state;
      }

      return { ...state, columns: reordered };
    }

    case "deleteCard": {
      const { [action.cardId]: removed, ...remainingCards } = state.cards;
      if (!removed) {
        return state;
      }

      return {
        cards: remainingCards,
        columns: state.columns.map((column) => ({
          ...column,
          cardIds: column.cardIds.filter((id) => id !== action.cardId),
        })),
      };
    }

    case "moveCard": {
      const { cardId, fromColumnId, toColumnId, toIndex } = action.payload;
      const fromIndex = findColumnIndex(state.columns, fromColumnId);
      const toColIndex = findColumnIndex(state.columns, toColumnId);

      if (fromIndex === -1 || toColIndex === -1) {
        return state;
      }

      const fromColumn = state.columns[fromIndex];
      if (!fromColumn.cardIds.includes(cardId)) {
        return state;
      }

      const nextColumns = state.columns.map((column) => ({
        ...column,
        cardIds: [...column.cardIds],
      }));

      const sourceColumn = nextColumns[fromIndex];
      sourceColumn.cardIds = sourceColumn.cardIds.filter((id) => id !== cardId);

      const destinationColumn = nextColumns[toColIndex];
      const clampedIndex = Math.max(
        0,
        Math.min(toIndex, destinationColumn.cardIds.length),
      );
      destinationColumn.cardIds.splice(clampedIndex, 0, cardId);

      return { ...state, columns: nextColumns };
    }

    default:
      return state;
  }
}
