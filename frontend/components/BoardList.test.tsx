import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BoardList } from "./BoardList";
import type { BoardSummary } from "@/lib/types";

const dummyBoards: BoardSummary[] = [
  { id: "1", name: "My First Board" },
  { id: "2", name: "Personal errands" },
];

describe("BoardList component", () => {
  it("renders a card per board", () => {
    render(<BoardList boards={dummyBoards} onCreate={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByTestId("board-card-1")).toBeInTheDocument();
    expect(screen.getByTestId("board-card-2")).toBeInTheDocument();
    expect(screen.getByText("My First Board")).toBeInTheDocument();
    expect(screen.getByText("Personal errands")).toBeInTheDocument();
  });

  it("shows an empty state when there are no boards", () => {
    render(<BoardList boards={[]} onCreate={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText(/no boards yet/i)).toBeInTheDocument();
  });

  it("submits the trimmed name and clears the input on create", () => {
    const onCreate = vi.fn();
    render(<BoardList boards={dummyBoards} onCreate={onCreate} onDelete={vi.fn()} />);

    const input = screen.getByTestId("board-name-input");
    fireEvent.change(input, { target: { value: "  New board  " } });
    fireEvent.click(screen.getByTestId("create-board-button"));

    expect(onCreate).toHaveBeenCalledWith("New board");
    expect(input).toHaveValue("");
  });

  it("blocks creating a board with an empty name", () => {
    const onCreate = vi.fn();
    render(<BoardList boards={dummyBoards} onCreate={onCreate} onDelete={vi.fn()} />);

    fireEvent.click(screen.getByTestId("create-board-button"));

    expect(screen.getByText("Board name is required.")).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("dispatches onDelete with the board id", () => {
    const onDelete = vi.fn();
    render(<BoardList boards={dummyBoards} onCreate={vi.fn()} onDelete={onDelete} />);

    fireEvent.click(screen.getByTestId("delete-board-1"));

    expect(onDelete).toHaveBeenCalledWith("1");
  });
});
