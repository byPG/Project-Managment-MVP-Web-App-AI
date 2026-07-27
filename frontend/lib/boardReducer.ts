import type { BoardAction, BoardState } from "./types";

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function findColumnIndex(columns: BoardState["columns"], columnId: string): number {
  return columns.findIndex((column) => column.id === columnId);
}

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

    case "setBoard": {
      return action.board;
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
