export type Card = {
  id: string;
  title: string;
  details: string;
};

export type Column = {
  id: string;
  title: string;
  cardIds: string[];
};

export type BoardState = {
  cards: Record<string, Card>;
  columns: Column[];
};

export type BoardSummary = {
  id: string;
  name: string;
};

export type AddCardPayload = {
  id?: string;
  title: string;
  details: string;
};

export type MoveCardPayload = {
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
  toIndex: number;
};

export type EditCardPayload = {
  cardId: string;
  title: string;
  details: string;
};

export type BoardAction =
  | { type: "setBoard"; board: BoardState }
  | { type: "renameColumn"; columnId: string; title: string }
  | { type: "addCard"; columnId: string; card: AddCardPayload }
  | { type: "editCard"; payload: EditCardPayload }
  | { type: "deleteCard"; cardId: string }
  | { type: "moveCard"; payload: MoveCardPayload }
  | { type: "addColumn"; title: string }
  | { type: "deleteColumn"; columnId: string }
  | { type: "reorderColumns"; columnIds: string[] };
