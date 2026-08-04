import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Board } from "./Board";
import type { BoardState } from "@/lib/types";

const dummyState: BoardState = {
  cards: {
    "card-1": { id: "card-1", title: "First Card", details: "First Details" },
  },
  columns: [
    { id: "col-1", title: "Backlog", cardIds: ["card-1"] },
    { id: "col-2", title: "To Do", cardIds: [] },
    { id: "col-3", title: "In Progress", cardIds: [] },
    { id: "col-4", title: "Review", cardIds: [] },
    { id: "col-5", title: "Done", cardIds: [] },
  ],
};

describe("Board component", () => {
  it("renders 5 columns and initial cards", () => {
    const dispatch = vi.fn();
    render(<Board state={dummyState} dispatch={dispatch} />);

    expect(screen.getByTestId("column-col-1")).toBeInTheDocument();
    expect(screen.getByTestId("column-col-2")).toBeInTheDocument();
    expect(screen.getByTestId("column-col-3")).toBeInTheDocument();
    expect(screen.getByTestId("column-col-4")).toBeInTheDocument();
    expect(screen.getByTestId("column-col-5")).toBeInTheDocument();
    expect(screen.getByText("First Card")).toBeInTheDocument();
  });

  it("triggers rename column action on enter key", () => {
    const dispatch = vi.fn();
    render(<Board state={dummyState} dispatch={dispatch} />);

    const titleBtn = screen.getByTestId("column-title-col-1");
    fireEvent.click(titleBtn);

    const input = screen.getByTestId("column-title-input-col-1");
    fireEvent.change(input, { target: { value: "New Backlog Name" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(dispatch).toHaveBeenCalledWith({
      type: "renameColumn",
      columnId: "col-1",
      title: "New Backlog Name",
    });
  });

  it("opens add card modal and submits new card", () => {
    const dispatch = vi.fn();
    render(<Board state={dummyState} dispatch={dispatch} />);

    const addBtn = screen.getByTestId("add-card-button-col-1");
    fireEvent.click(addBtn);

    expect(screen.getByTestId("add-card-modal")).toBeInTheDocument();

    const titleInput = screen.getByTestId("card-title-input");
    const detailsInput = screen.getByTestId("card-details-input");
    const submitBtn = screen.getByTestId("submit-card-button");

    fireEvent.change(titleInput, { target: { value: "Created Card" } });
    fireEvent.change(detailsInput, { target: { value: "Created Details" } });
    fireEvent.click(submitBtn);

    expect(dispatch).toHaveBeenCalledWith({
      type: "addCard",
      columnId: "col-1",
      card: {
        title: "Created Card",
        details: "Created Details",
      },
    });
  });

  it("dispatches deleteCard when delete button clicked", () => {
    const dispatch = vi.fn();
    render(<Board state={dummyState} dispatch={dispatch} />);

    const deleteBtn = screen.getByTestId("delete-card-card-1");
    fireEvent.click(deleteBtn);

    expect(dispatch).toHaveBeenCalledWith({
      type: "deleteCard",
      cardId: "card-1",
    });
  });

  it("prevents submitting a card without a title", () => {
    const dispatch = vi.fn();
    render(<Board state={dummyState} dispatch={dispatch} />);

    fireEvent.click(screen.getByTestId("add-card-button-col-1"));
    fireEvent.click(screen.getByTestId("submit-card-button"));

    expect(screen.getByText("Card title is required")).toBeInTheDocument();
    expect(screen.getByTestId("add-card-modal")).toBeInTheDocument();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
