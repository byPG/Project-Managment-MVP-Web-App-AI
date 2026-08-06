import { describe, it, expect } from "vitest";
import { boardReducer, resolveDragMove } from "./boardReducer";
import type { BoardState } from "./types";

const initialTestState: BoardState = {
  cards: {
    "card-1": { id: "card-1", title: "Task 1", details: "Details 1" },
    "card-2": { id: "card-2", title: "Task 2", details: "Details 2" },
  },
  columns: [
    { id: "col-1", title: "Backlog", cardIds: ["card-1"] },
    { id: "col-2", title: "To Do", cardIds: ["card-2"] },
    { id: "col-3", title: "In Progress", cardIds: [] },
    { id: "col-4", title: "Review", cardIds: [] },
    { id: "col-5", title: "Done", cardIds: [] },
  ],
};

describe("boardReducer", () => {
  it("should rename a column title", () => {
    const nextState = boardReducer(initialTestState, {
      type: "renameColumn",
      columnId: "col-1",
      title: "  Ideas  ",
    });

    expect(nextState.columns[0].title).toBe("Ideas");
  });

  it("should not rename column if new title is empty string", () => {
    const nextState = boardReducer(initialTestState, {
      type: "renameColumn",
      columnId: "col-1",
      title: "   ",
    });

    expect(nextState.columns[0].title).toBe("Backlog");
  });

  it("should add a new card to a column", () => {
    const nextState = boardReducer(initialTestState, {
      type: "addCard",
      columnId: "col-1",
      card: { title: "New Task", details: "New Details" },
    });

    expect(nextState.columns[0].cardIds.length).toBe(2);
    const newCardId = nextState.columns[0].cardIds[1];
    expect(nextState.cards[newCardId]).toEqual({
      id: newCardId,
      title: "New Task",
      details: "New Details",
    });
  });

  it("should delete a card from state and column", () => {
    const nextState = boardReducer(initialTestState, {
      type: "deleteCard",
      cardId: "card-1",
    });

    expect(nextState.cards["card-1"]).toBeUndefined();
    expect(nextState.columns[0].cardIds).not.toContain("card-1");
  });

  it("should move a card to another column", () => {
    const nextState = boardReducer(initialTestState, {
      type: "moveCard",
      payload: {
        cardId: "card-1",
        fromColumnId: "col-1",
        toColumnId: "col-2",
        toIndex: 0,
      },
    });

    expect(nextState.columns[0].cardIds).not.toContain("card-1");
    expect(nextState.columns[1].cardIds[0]).toBe("card-1");
  });
});

describe("resolveDragMove", () => {
  // Backend card IDs and column IDs are independent auto-increment
  // sequences, so a card can coincidentally share its raw id with a column
  // (e.g. card "4" dropped on column "4"). A drop must be resolved by
  // looking up what each id actually refers to, not by comparing the raw
  // ids for equality.
  const columnsWithCollidingIds: BoardState["columns"] = [
    { id: "1", title: "Backlog", cardIds: [] },
    { id: "2", title: "To Do", cardIds: ["4"] },
    { id: "3", title: "In Progress", cardIds: [] },
    { id: "4", title: "Review", cardIds: [] },
    { id: "5", title: "Done", cardIds: [] },
  ];

  it("moves a card whose id happens to equal the destination column's id", () => {
    const payload = resolveDragMove(columnsWithCollidingIds, "4", "4");

    expect(payload).toEqual({
      cardId: "4",
      fromColumnId: "2",
      toColumnId: "4",
      toIndex: 0,
    });
  });

  it("resolves a normal cross-column drop", () => {
    const payload = resolveDragMove(columnsWithCollidingIds, "4", "3");

    expect(payload).toEqual({
      cardId: "4",
      fromColumnId: "2",
      toColumnId: "3",
      toIndex: 0,
    });
  });

  it("treats a card dropped on itself as a no-op", () => {
    // over.id resolving to the dragged card's own id, in a column with no
    // id collision, should still be a no-op.
    const payload = resolveDragMove(
      [
        { id: "col-1", title: "Backlog", cardIds: ["card-1"] },
        { id: "col-2", title: "To Do", cardIds: [] },
      ],
      "card-1",
      "card-1",
    );

    expect(payload).toBeNull();
  });

  it("returns null when the dragged card isn't in any column", () => {
    const payload = resolveDragMove(columnsWithCollidingIds, "unknown-card", "3");

    expect(payload).toBeNull();
  });

  it("returns null when the drop target doesn't resolve to a column", () => {
    const payload = resolveDragMove(columnsWithCollidingIds, "4", "unknown-target");

    expect(payload).toBeNull();
  });
});
